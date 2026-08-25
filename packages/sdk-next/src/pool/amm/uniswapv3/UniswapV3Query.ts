import { SizedHex } from 'polkadot-api';

import { TickMath, nearestUsableTick } from '@uniswap/v3-sdk';

import { PoolQuery } from '../../PoolQuery';

import { ERC20_ABI, FACTORY_ABI, POOL_ABI } from './abi';
import { V3Tick } from './types';

/** The zero H160 — what an unset address and a missing pool both read as */
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

/**
 * Ticks to cover on each side of the current price when loading a pool.
 *
 * ~20k ticks is a ~7.4x price move — far beyond any band a managed vault runs,
 * and beyond what a single trade would cross before the on-chain re-quote takes
 * over.
 */
const TICK_WINDOW_TICKS = 20_000;

/** Hard cap on bitmap words per side, so one tight-spacing pool cannot flood the RPC */
const MAX_TICK_WINDOW_WORDS = 12;

/**
 * Bitmap words to read on each side of the current tick.
 *
 * A word spans `256 * tickSpacing` ticks, so a FIXED word count means wildly
 * different price coverage per tier — at spacing 60 five words is ~2000x, at
 * spacing 1 it is ±13.7%. Sizing from a tick target instead keeps coverage
 * comparable across tiers.
 *
 * Beyond the loaded ticks the walk meets zero-liquidity sentinels, so it quotes
 * as if liquidity continued unchanged — it over-quotes rather than under-quotes.
 * That is why the window is sized generously and why `windowWords` reports when
 * the cap binds rather than truncating in silence.
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
 * - Bit `i` of the word at `wordPos` is compressed tick `wordPos * 256 + i`
 * - Its absolute tick is that, scaled by `tickSpacing`
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
 * Does this error mean the runtime has no such storage entry, rather than that
 * we failed to ask?
 *
 * Only the first is a real answer ("v3 is not deployed on this chain"). A
 * dropped connection, a timeout or an RPC error must propagate, or a cached
 * `undefined` turns a blip into a session-long outage.
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
  nearestUsableTick(TickMath.MIN_TICK, tickSpacing),
  nearestUsableTick(TickMath.MAX_TICK, tickSpacing),
];

/** A pool's concentrated-liquidity state together with its reserves */
export type V3PoolSlice = {
  sqrtPriceX96: bigint;
  tick: number;
  liquidity: bigint;
  ticks: V3Tick[];
  balance0: bigint;
  balance1: bigint;
};

/**
 * Uniswap v3 reads.
 *
 * - The factory address is chain state; everything below it is EVM
 * - An EVM read names no block, so `at` scopes its memo to one block rather
 *   than pinning the value
 */
export class UniswapV3Query extends PoolQuery {
  /**
   * The governance-set v3 factory; `undefined` when v3 is not deployed here.
   *
   * - Read through the unsafe api: the item only exists on runtimes carrying
   *   the v3 router, so a typed read would not compile against the ones without
   * - A missing pallet, a missing entry and a zeroed address all say the same
   *   thing, so all three read as `undefined`
   *
   * A TRANSPORT failure says something different and must not be flattened into
   * the same answer. This result is cached `persistent`, so returning
   * `undefined` for a dropped websocket would memoize "v3 is not deployed" for
   * the rest of the session — one flaky read during startup and the venue stays
   * silently off until the client reseeds. Anything that is not a
   * missing-storage-entry error is rethrown so the cache never stores it.
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

  /**
   * The canonical pool for a `(token0, token1, fee)` triple.
   *
   * - `getPool` is deterministic and a pool is never redeployed, so the answer
   *   holds until the client reseeds
   */
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
   * A pool's price, liquidity, initialized ticks and reserves.
   *
   * - Read as one slice so a quote can't be assembled from two EVM tips
   * - Block-scoped: one read per pool per block, dropped when the block moves
   */
  readonly poolSlice = this.cache.scope<
    [`0x${string}`, `0x${string}`, `0x${string}`, number],
    V3PoolSlice
  >(
    'UniswapV3Pool.slice',
    (_at, address, token0, token1, tickSpacing) =>
      this.readSlice(address, token0, token1, tickSpacing),
    (address) => address,
    'block'
  );

  private async readSlice(
    address: `0x${string}`,
    token0: `0x${string}`,
    token1: `0x${string}`,
    tickSpacing: number
  ): Promise<V3PoolSlice> {
    const client = this.evm.getWsProvider();

    const [slot0, liquidity, balance0, balance1] = await Promise.all([
      client.readContract({ abi: POOL_ABI, address, functionName: 'slot0' }),
      client.readContract({
        abi: POOL_ABI,
        address,
        functionName: 'liquidity',
      }),
      client.readContract({
        abi: ERC20_ABI,
        address: token0,
        functionName: 'balanceOf',
        args: [address],
      }),
      client.readContract({
        abi: ERC20_ABI,
        address: token1,
        functionName: 'balanceOf',
        args: [address],
      }),
    ]);

    const tick = slot0[1];
    const ticks = await this.readTicks(address, tick, tickSpacing);

    return {
      sqrtPriceX96: slot0[0],
      tick,
      liquidity,
      ticks,
      balance0,
      balance1,
    };
  }

  /**
   * The initialized ticks in a window around the current tick.
   *
   * - Read through the tick bitmap, one word at a time
   * - Bounded by the usable min/max ticks as zero-liquidity sentinels, so the
   *   swap walk always terminates
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
