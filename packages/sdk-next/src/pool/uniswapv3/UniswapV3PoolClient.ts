import { PublicClient } from 'viem';
import { Subscription, filter, map, mergeMap } from 'rxjs';

import { erc20 } from '@galacticcouncil/common';

import {
  FeeAmount,
  TICK_SPACINGS,
  TickMath,
  nearestUsableTick,
} from '@uniswap/v3-sdk';

import { PoolFees, PoolPair, PoolType } from '../types';
import { PoolClient } from '../PoolClient';

import { ERC20_ABI, FACTORY_ABI, POOL_ABI } from './abi';
import { UNISWAP_V3_FACTORY, V3PoolConfig, V3_POOLS } from './const';
import { UniswapV3PoolBase, UniswapV3PoolFees, V3Tick } from './types';

const { ERC20 } = erc20;

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
const FEE_DENOMINATOR = 1_000_000;

/**
 * Bitmap words read on each side of the current tick when loading a pool's
 * initialized ticks. One word spans `256 * tickSpacing` ticks, so this window
 * covers a wide price range for every fee tier. A trade that would move the
 * price beyond the loaded ticks is quoted against the outermost loaded
 * liquidity; the on-chain re-quote at execution remains authoritative.
 */
const TICK_WINDOW_WORDS = 5;

/**
 * Decode one tick-bitmap word into the absolute tick indices it marks
 * initialized. Bit `i` of the word at `wordPos` is compressed tick
 * `wordPos * 256 + i`, i.e. absolute tick `(wordPos * 256 + i) * tickSpacing`.
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
 * Router venue for Uniswap v3 pools on Hydration's EVM.
 *
 * Pools come from a curated per-chain config (`V3_POOLS`) and are resolved via
 * the v3 factory — mirroring the on-chain design where v3 routes are
 * governance-gated rather than permissionless. Concentrated-liquidity state
 * (`slot0`, `liquidity`, and initialized ticks via the tick bitmap) is read
 * directly over the EVM; quoting itself is client-side in
 * `UniswapV3Pool`/`UniswapV3Math`.
 */
export class UniswapV3PoolClient extends PoolClient<UniswapV3PoolBase> {
  getPoolType(): PoolType {
    return PoolType.V3;
  }

  async isSupported(): Promise<boolean> {
    return true;
  }

  /** Fixed per-pool fee tier as a `[numerator, denominator]` fraction. */
  async getPoolFees(_pair: PoolPair, address: string): Promise<PoolFees> {
    const pool = this.store.pools.find((p) => p.address === address);
    const fee = pool ? pool.fee : 0;
    return { fee: [fee, FEE_DENOMINATOR] } as UniswapV3PoolFees;
  }

  /** Resolve and load every configured pool; pools that fail to load are skipped. */
  async loadPools(): Promise<UniswapV3PoolBase[]> {
    const client = this.evm.getWsProvider();
    const loaded = await Promise.all(
      V3_POOLS.map((cfg) => this.loadPool(client, cfg))
    );
    return loaded.filter((p): p is UniswapV3PoolBase => p !== undefined);
  }

  private async loadPool(
    client: PublicClient,
    cfg: V3PoolConfig
  ): Promise<UniswapV3PoolBase | undefined> {
    try {
      const { assetA, assetB, fee } = cfg;
      const tickSpacing = TICK_SPACINGS[fee as FeeAmount];
      if (tickSpacing === undefined) return undefined;

      const addrA = ERC20.fromAssetId(assetA).toLowerCase() as `0x${string}`;
      const addrB = ERC20.fromAssetId(assetB).toLowerCase() as `0x${string}`;
      const aIsToken0 = addrA < addrB;
      const token0 = aIsToken0 ? assetA : assetB;
      const token1 = aIsToken0 ? assetB : assetA;
      const addr0 = aIsToken0 ? addrA : addrB;
      const addr1 = aIsToken0 ? addrB : addrA;

      const poolAddress = await client.readContract({
        abi: FACTORY_ABI,
        address: UNISWAP_V3_FACTORY as `0x${string}`,
        functionName: 'getPool',
        args: [addr0, addr1, fee],
      });
      if (poolAddress.toLowerCase() === ADDRESS_ZERO) return undefined;

      const [slot0, liquidity, balance0, balance1, meta0, meta1] =
        await Promise.all([
          client.readContract({
            abi: POOL_ABI,
            address: poolAddress,
            functionName: 'slot0',
          }),
          client.readContract({
            abi: POOL_ABI,
            address: poolAddress,
            functionName: 'liquidity',
          }),
          client.readContract({
            abi: ERC20_ABI,
            address: addr0,
            functionName: 'balanceOf',
            args: [poolAddress],
          }),
          client.readContract({
            abi: ERC20_ABI,
            address: addr1,
            functionName: 'balanceOf',
            args: [poolAddress],
          }),
          this.api.query.AssetRegistry.Assets.getValue(token0, { at: this.at }),
          this.api.query.AssetRegistry.Assets.getValue(token1, { at: this.at }),
        ]);

      const sqrtPriceX96 = slot0[0];
      const tick = slot0[1];
      const ticks = await this.loadTicks(
        client,
        poolAddress,
        tick,
        tickSpacing
      );

      return {
        address: poolAddress,
        type: PoolType.V3,
        token0,
        token1,
        fee,
        sqrtPriceX96,
        tick,
        liquidity,
        tickSpacing,
        ticks,
        tokens: [
          {
            id: token0,
            decimals: meta0?.decimals,
            existentialDeposit: meta0?.existential_deposit ?? 0n,
            balance: balance0,
            type: meta0?.asset_type.type,
          },
          {
            id: token1,
            decimals: meta1?.decimals,
            existentialDeposit: meta1?.existential_deposit ?? 0n,
            balance: balance1,
            type: meta1?.asset_type.type,
          },
        ],
        maxInRatio: 3n,
        maxOutRatio: 3n,
        minTradingLimit: 0n,
      } as UniswapV3PoolBase;
    } catch (e) {
      this.log.error('v3_load_pool', cfg, e);
      return undefined;
    }
  }

  /**
   * Read the initialized ticks in a bounded window around the current tick via
   * the pool's tick bitmap, plus the usable min/max ticks as zero-liquidity
   * sentinels so the swap walk is always bounded (a full-range pool with no
   * ticks in range simply yields the two sentinels).
   */
  private async loadTicks(
    client: PublicClient,
    poolAddress: `0x${string}`,
    currentTick: number,
    tickSpacing: number
  ): Promise<V3Tick[]> {
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
          address: poolAddress,
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
          address: poolAddress,
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

    const min = nearestUsableTick(TickMath.MIN_TICK, tickSpacing);
    const max = nearestUsableTick(TickMath.MAX_TICK, tickSpacing);
    if (!ticks.some((t) => t.index === min)) {
      ticks.push({ index: min, liquidityNet: 0n, liquidityGross: 0n });
    }
    if (!ticks.some((t) => t.index === max)) {
      ticks.push({ index: max, liquidityNet: 0n, liquidityGross: 0n });
    }
    ticks.sort((a, b) => a.index - b.index);
    return ticks;
  }

  private async refreshPool(
    client: PublicClient,
    pool: UniswapV3PoolBase
  ): Promise<UniswapV3PoolBase> {
    const address = pool.address as `0x${string}`;
    const addr0 = ERC20.fromAssetId(pool.token0).toLowerCase() as `0x${string}`;
    const addr1 = ERC20.fromAssetId(pool.token1).toLowerCase() as `0x${string}`;
    const [slot0, liquidity, balance0, balance1] = await Promise.all([
      client.readContract({ abi: POOL_ABI, address, functionName: 'slot0' }),
      client.readContract({ abi: POOL_ABI, address, functionName: 'liquidity' }),
      client.readContract({
        abi: ERC20_ABI,
        address: addr0,
        functionName: 'balanceOf',
        args: [address],
      }),
      client.readContract({
        abi: ERC20_ABI,
        address: addr1,
        functionName: 'balanceOf',
        args: [address],
      }),
    ]);
    const tick = slot0[1];
    const ticks = await this.loadTicks(client, address, tick, pool.tickSpacing);
    const tokens = pool.tokens.map((t) =>
      t.id === pool.token0
        ? { ...t, balance: balance0 }
        : { ...t, balance: balance1 }
    );
    return { ...pool, sqrtPriceX96: slot0[0], tick, liquidity, ticks, tokens };
  }

  /**
   * The base balance watcher targets substrate accounts, but a v3 pool is an
   * EVM contract — its reserves, price and ticks are refreshed via EVM reads in
   * `subscribeUpdates`/`loadPools` instead (mirrors `AavePoolClient`).
   */
  protected override subscribeBalances(): Subscription {
    return Subscription.EMPTY;
  }

  /** Re-sync a pool's state whenever it emits an EVM log (swap/mint/burn). */
  protected subscribeUpdates(): Subscription {
    const addresses = new Set(
      this.store.pools.map((p) => p.address.toLowerCase())
    );

    return this.api.event.EVM.Log.watch()
      .pipe(
        mergeMap(({ events }) => events),
        map(({ payload }) => payload.log.address.toLowerCase()),
        filter((address) => addresses.has(address)),
        this.watchGuard('evm.Log')
      )
      .subscribe((address) => {
        this.log.trace('evm.Log', address);
        this.store.update(async (pools) => {
          const client = this.evm.getWsProvider();
          const updated: UniswapV3PoolBase[] = [];
          for (const pool of pools) {
            if (pool.address.toLowerCase() === address) {
              updated.push(await this.refreshPool(client, pool));
            }
          }
          return updated;
        });
      });
  }
}
