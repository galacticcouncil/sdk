import { SizedHex } from 'polkadot-api';

import { TickMath, nearestUsableTick } from '@uniswap/v3-sdk';

import { PoolQuery } from '../../PoolQuery';

import { ERC20_ABI, FACTORY_ABI, POOL_ABI } from './abi';
import { V3Tick } from './types';

/** The zero H160 — what an unset address and a missing pool both read as */
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

/**
 * Bitmap words read on each side of the current tick.
 *
 * - One word spans `256 * tickSpacing` ticks, so this covers a wide price range
 *   at every fee tier
 * - A trade beyond the loaded ticks quotes against the outermost loaded
 *   liquidity; the on-chain re-quote at execution stays authoritative
 */
const TICK_WINDOW_WORDS = 5;

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
   */
  readonly factory = this.cache.scope<[], `0x${string}` | undefined>(
    'Parameters.UniswapV3Factory',
    async (at) => {
      try {
        const value = (await this.client
          .getUnsafeApi()
          .query.Parameters.UniswapV3Factory.getValue({ at })) as
          | SizedHex<20>
          | undefined;
        const address = value as `0x${string}` | undefined;
        return address && address.toLowerCase() !== ADDRESS_ZERO
          ? address
          : undefined;
      } catch {
        return undefined;
      }
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
    const wordPositions: number[] = [];
    for (
      let w = currentWord - TICK_WINDOW_WORDS;
      w <= currentWord + TICK_WINDOW_WORDS;
      w++
    ) {
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
