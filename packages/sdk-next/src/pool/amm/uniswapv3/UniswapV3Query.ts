import { SizedHex } from 'polkadot-api';

import { PoolQuery } from '../../PoolQuery';

import { FACTORY_ABI, POOL_ABI } from './abi';
import { MAX_TICK, MIN_TICK, nearestUsableTick } from './math';
import { V3Tick } from './types';

/** The zero H160 — what an unset address and a missing pool both read as */
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

/** Ticks to cover each side of the current price; ~20k is a ~7.4x price move */
const TICK_WINDOW_TICKS = 20_000;

/** Hard cap on bitmap words per side, so one tight-spacing pool cannot flood the RPC */
const MAX_TICK_WINDOW_WORDS = 12;

/**
 * Bitmap words to read on each side of the current tick.
 *
 * - A word spans `256 * tickSpacing`, so sizing from a tick target keeps
 *   coverage comparable across fee tiers
 * - Past the loaded ticks the walk meets zero-liquidity sentinels and
 *   over-quotes, so `capped` reports a window cut short
 */
export function windowWords(tickSpacing: number): {
  words: number;
  covers: number;
  capped: boolean;
} {
  const perWord = 256 * tickSpacing;
  const wanted = Math.max(1, Math.ceil(TICK_WINDOW_TICKS / perWord));
  const words = Math.min(wanted, MAX_TICK_WINDOW_WORDS);
  return { words, covers: words * perWord, capped: words < wanted };
}

/**
 * Decode one tick-bitmap word into the tick indices it marks initialized.
 *
 * @param bitmap - the word read from `tickBitmap`
 * @param wordPos - the word's position in the bitmap
 * @param tickSpacing - the pool's tick spacing
 */
export function ticksInWord(
  bitmap: bigint,
  wordPos: number,
  tickSpacing: number
): number[] {
  const ticks: number[] = [];
  for (let bit = 0; bit < 256; bit++) {
    if ((bitmap >> BigInt(bit)) & 1n) {
      ticks.push((wordPos * 256 + bit) * tickSpacing);
    }
  }
  return ticks;
}

/**
 * Whether the runtime has no such storage entry, as opposed to the read failing.
 *
 * Only the first means v3 is absent; a transport failure must propagate, or the
 * cache memoizes a blip for the rest of the session.
 */
function isMissingStorageEntry(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? err).toLowerCase();
  return (
    msg.includes('not found') ||
    msg.includes('unknown') ||
    msg.includes('no entry') ||
    msg.includes('cannot read properties of undefined')
  );
}

/** The usable min/max ticks for a spacing — the bounds of any swap walk */
const boundTicks = (tickSpacing: number): number[] => [
  nearestUsableTick(MIN_TICK, tickSpacing),
  nearestUsableTick(MAX_TICK, tickSpacing),
];

/**
 * Depth as the constant-product reserves equivalent to the ACTIVE liquidity:
 * `L * 2^96 / sqrtPriceX96` and `L * sqrtPriceX96 / 2^96`.
 *
 * - Mirrors the runtime's `UniswapV3TradeExecutor::liquidity_depth`
 * - `balanceOf` counts liquidity parked outside the current range, and skews at
 *   a band edge
 *
 * @param sqrtPriceX96 - the pool's current Q64.96 sqrt price
 * @param liquidity - the pool's active liquidity
 */
export function virtualReserves(
  sqrtPriceX96: bigint,
  liquidity: bigint
): { reserve0: bigint; reserve1: bigint } {
  if (liquidity <= 0n || sqrtPriceX96 <= 0n) {
    return { reserve0: 0n, reserve1: 0n };
  }
  return {
    reserve0: (liquidity << 96n) / sqrtPriceX96,
    reserve1: (liquidity * sqrtPriceX96) >> 96n,
  };
}

/** A pool's concentrated-liquidity state together with its depth */
export type V3PoolSlice = {
  sqrtPriceX96: bigint;
  tick: number;
  liquidity: bigint;
  ticks: V3Tick[];
  reserve0: bigint;
  reserve1: bigint;
};

/**
 * Uniswap v3 reads. The factory address is chain state, everything below it EVM.
 *
 * An EVM read names no block, so `at` scopes its memo rather than pinning it.
 */
export class UniswapV3Query extends PoolQuery {
  /**
   * The governance-set v3 factory; `undefined` where v3 is not deployed.
   *
   * Unsafe api, since the item is absent on runtimes without the v3 router. A
   * transport failure is rethrown, or the `persistent` cache stores a blip as
   * "not deployed" for the session.
   */
  readonly factory = this.cache.scope<[], `0x${string}` | undefined>(
    'Parameters.UniswapV3Factory',
    async (at) => {
      let value: SizedHex<20> | undefined;
      try {
        value = (await this.client
          .getUnsafeApi()
          .query.Parameters.UniswapV3Factory.getValue({ at })) as
          | SizedHex<20>
          | undefined;
      } catch (err) {
        if (isMissingStorageEntry(err)) return undefined;
        throw err;
      }
      const address = value as `0x${string}` | undefined;
      return address && address.toLowerCase() !== ADDRESS_ZERO
        ? address
        : undefined;
    },
    () => 'factory',
    'persistent'
  );

  /** The canonical pool for a `(token0, token1, fee)` triple */
  readonly poolAddress = this.cache.scope<
    [`0x${string}`, `0x${string}`, `0x${string}`, number],
    `0x${string}` | undefined
  >(
    'UniswapV3Factory.getPool',
    async (_at, factory, token0, token1, fee) => {
      const address = await this.evm.getWsProvider().readContract({
        abi: FACTORY_ABI,
        address: factory,
        functionName: 'getPool',
        args: [token0, token1, fee],
      });
      return address.toLowerCase() === ADDRESS_ZERO ? undefined : address;
    },
    (factory, token0, token1, fee) => `${factory}:${token0}:${token1}:${fee}`,
    'persistent'
  );

  /**
   * The tick spacing the factory has enabled for a fee tier, 0 when unenabled.
   *
   * Read from the deployment, which can carry tiers the canonical one does not.
   */
  readonly tickSpacing = this.cache.scope<
    [`0x${string}`, number],
    number | undefined
  >(
    'UniswapV3Factory.feeAmountTickSpacing',
    async (_at, factory, fee) => {
      const spacing = await this.evm.getWsProvider().readContract({
        abi: FACTORY_ABI,
        address: factory,
        functionName: 'feeAmountTickSpacing',
        args: [fee],
      });
      return spacing > 0 ? spacing : undefined;
    },
    (factory, fee) => `${factory}:${fee}`,
    'persistent'
  );

  /** Price, liquidity, ticks and depth, read as one slice per pool per block */
  readonly poolSlice = this.cache.scope<[`0x${string}`, number], V3PoolSlice>(
    'UniswapV3Pool.slice',
    (_at, address, tickSpacing) => this.readSlice(address, tickSpacing),
    (address) => address,
    'block'
  );

  private async readSlice(
    address: `0x${string}`,
    tickSpacing: number
  ): Promise<V3PoolSlice> {
    const client = this.evm.getWsProvider();

    const [slot0, liquidity] = await Promise.all([
      client.readContract({ abi: POOL_ABI, address, functionName: 'slot0' }),
      client.readContract({
        abi: POOL_ABI,
        address,
        functionName: 'liquidity',
      }),
    ]);

    const sqrtPriceX96 = slot0[0];
    const tick = slot0[1];
    const ticks = await this.readTicks(address, tick, tickSpacing);
    const { reserve0, reserve1 } = virtualReserves(sqrtPriceX96, liquidity);

    return {
      sqrtPriceX96,
      tick,
      liquidity,
      ticks,
      reserve0,
      reserve1,
    };
  }

  /**
   * The initialized ticks around the current tick, bounded by the usable
   * min/max as zero-liquidity sentinels so the swap walk terminates.
   */
  private async readTicks(
    address: `0x${string}`,
    currentTick: number,
    tickSpacing: number
  ): Promise<V3Tick[]> {
    const client = this.evm.getWsProvider();

    const currentWord = Math.floor(currentTick / tickSpacing) >> 8;
    const { words, covers, capped } = windowWords(tickSpacing);
    if (capped) {
      console.warn(
        `[uniswapv3] tickSpacing ${tickSpacing}: tick window capped at ` +
          `${words} words (±${covers} ticks) — liquidity beyond that is not ` +
          `loaded and quotes there over-state available depth`
      );
    }
    const wordPositions: number[] = [];
    for (let w = currentWord - words; w <= currentWord + words; w++) {
      wordPositions.push(w);
    }

    const bitmaps = await Promise.all(
      wordPositions.map((w) =>
        client.readContract({
          abi: POOL_ABI,
          address,
          functionName: 'tickBitmap',
          args: [w],
        })
      )
    );
    const indices = wordPositions.flatMap((w, i) =>
      ticksInWord(bitmaps[i], w, tickSpacing)
    );

    const infos = await Promise.all(
      indices.map((index) =>
        client.readContract({
          abi: POOL_ABI,
          address,
          functionName: 'ticks',
          args: [index],
        })
      )
    );

    const ticks: V3Tick[] = indices.map((index, i) => ({
      index,
      liquidityGross: infos[i][0],
      liquidityNet: infos[i][1],
    }));

    for (const bound of boundTicks(tickSpacing)) {
      if (!ticks.some((t) => t.index === bound)) {
        ticks.push({ index: bound, liquidityNet: 0n, liquidityGross: 0n });
      }
    }
    ticks.sort((a, b) => a.index - b.index);
    return ticks;
  }
}
