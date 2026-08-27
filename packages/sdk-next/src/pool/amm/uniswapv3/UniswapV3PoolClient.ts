import { BlockRef } from '../../../api';

import { PoolEventHandler, PoolMutation } from '../../events';
import { PoolFees, PoolPair, PoolType } from '../../types';
import { PoolClient } from '../../PoolClient';
import { TAssetDetails, TAssetLocation } from '../../PoolQuery';

import { assetAddress } from './assetAddress';
import { V3PoolConfig, V3_POOLS } from './const';
import { UniswapV3Query, V3PoolSlice } from './UniswapV3Query';
import { UniswapV3PoolBase, UniswapV3PoolFees } from './types';

const FEE_DENOMINATOR = 1_000_000;

/** One configured pool, resolved to the deployment it names */
type V3PoolRef = {
  address: `0x${string}`;
  fee: number;
  tickSpacing: number;
  token0: number;
  token1: number;
  addr0: `0x${string}`;
  addr1: `0x${string}`;
};

/**
 * Router venue for Uniswap v3 pools on Hydration's EVM.
 *
 * - Pools come from a curated config, resolved through the v3 factory, the way
 *   the runtime gates v3 routes by governance rather than by discovery
 * - Concentrated-liquidity state is read over the EVM; quoting itself is
 *   client-side, in `UniswapV3Pool` / `UniswapV3Math`
 * - The factory address is read from chain state, so the venue disables itself
 *   on chains where v3 was never deployed
 */
export class UniswapV3PoolClient extends PoolClient<UniswapV3PoolBase> {
  protected readonly query = new UniswapV3Query(this.client, this.evm);

  getPoolType(): PoolType {
    return PoolType.V3;
  }

  async isSupported(): Promise<boolean> {
    const factory = await this.query.factory.get(this.at);
    return factory !== undefined;
  }

  /** Fixed per-pool fee tier as a `[numerator, denominator]` fraction */
  async getPoolFees(_pair: PoolPair, address: string): Promise<PoolFees> {
    const pool = this.store.pools.find((p) => p.address === address);
    return { fee: [pool?.fee ?? 0, FEE_DENOMINATOR] } as UniswapV3PoolFees;
  }

  async loadPools(block: BlockRef): Promise<UniswapV3PoolBase[]> {
    const at = block.hash;

    const [factory, assets, locations] = await Promise.all([
      this.query.factory.get(at),
      this.query.assets.get(at),
      this.query.assetLocations.get(at),
    ]);

    if (!factory) {
      this.log.debug('v3_not_configured', 'Parameters.UniswapV3Factory unset');
      return [];
    }

    const pools = await Promise.all(
      V3_POOLS.map(async (cfg) => {
        try {
          const ref = await this.resolvePool(
            at,
            factory,
            cfg,
            assets,
            locations
          );
          if (!ref) return undefined;

          const slice = await this.query.poolSlice.get(
            at,
            ref.address,
            ref.tickSpacing
          );

          const meta0 = assets.get(ref.token0);
          const meta1 = assets.get(ref.token1);

          return {
            address: ref.address,
            type: PoolType.V3,
            token0: ref.token0,
            token1: ref.token1,
            fee: ref.fee,
            tickSpacing: ref.tickSpacing,
            addr0: ref.addr0,
            addr1: ref.addr1,
            sqrtPriceX96: slice.sqrtPriceX96,
            tick: slice.tick,
            liquidity: slice.liquidity,
            ticks: slice.ticks,
            tokens: [
              {
                id: ref.token0,
                decimals: meta0?.decimals,
                existentialDeposit: meta0?.existential_deposit ?? 0n,
                balance: slice.reserve0,
                type: meta0?.asset_type.type,
              },
              {
                id: ref.token1,
                decimals: meta1?.decimals,
                existentialDeposit: meta1?.existential_deposit ?? 0n,
                balance: slice.reserve1,
                type: meta1?.asset_type.type,
              },
            ],
            // Nothing on chain caps a v3 trade by pool size. Same sentinel the
            // Aave venue uses; `UniswapV3Pool` skips the ratio checks entirely
            // and reports an unfillable order instead.
            maxInRatio: 0n,
            maxOutRatio: 0n,
            minTradingLimit: 0n,
          } as UniswapV3PoolBase;
        } catch (e) {
          this.log.error('v3_load_pool', cfg, e);
          return undefined;
        }
      })
    );

    return pools.filter((p): p is UniswapV3PoolBase => p !== undefined);
  }

  /**
   * The EVM address the RUNTIME uses for an asset — see {@link assetAddress}.
   * Same rule as `AavePoolClient.getReserveH160Id`.
   */
  private resolveAssetAddress(
    id: number,
    assets: Map<number, TAssetDetails>,
    locations: Map<number, TAssetLocation>
  ): `0x${string}` {
    const r = assetAddress(
      id,
      assets.get(id)?.asset_type.type,
      locations.get(id)
    );
    if (r.problem) this.log.error('v3_asset_address', r.problem);
    return r.address;
  }

  /**
   * Resolve one configured pool to the deployment it names.
   *
   * - v3 orders a pair by token address, so which asset is token0 is a property
   *   of the deployment, not of the config — and for two `Erc20` assets that is
   *   the CONTRACT sort, which can invert the id sort. aDOT/HOLLAR is exactly
   *   that case: by alias HOLLAR sorts first, by contract aDOT does
   * - An unknown fee tier or a pair with no pool at that tier yields nothing
   *
   * @param at - block the factory read is scoped to
   * @param factory - the v3 factory address
   * @param cfg - the configured pair and fee tier
   * @param assets - registry entries, for each asset's kind
   * @param locations - registry locations, carrying an `Erc20` asset's H160
   */
  private async resolvePool(
    at: string,
    factory: `0x${string}`,
    cfg: V3PoolConfig,
    assets: Map<number, TAssetDetails>,
    locations: Map<number, TAssetLocation>
  ): Promise<V3PoolRef | undefined> {
    const { assetA, assetB, fee } = cfg;

    const tickSpacing = await this.query.tickSpacing.get(at, factory, fee);
    if (tickSpacing === undefined) {
      this.log.error(
        'v3_resolve_pool',
        `fee tier ${fee} is not enabled on factory ${factory}`,
        cfg
      );
      return undefined;
    }

    const addrA = this.resolveAssetAddress(assetA, assets, locations);
    const addrB = this.resolveAssetAddress(assetB, assets, locations);
    const aIsToken0 = addrA < addrB;

    const addr0 = aIsToken0 ? addrA : addrB;
    const addr1 = aIsToken0 ? addrB : addrA;

    const address = await this.query.poolAddress.get(
      at,
      factory,
      addr0,
      addr1,
      fee
    );
    // A configured pool that does not resolve used to vanish here: `undefined` is
    // filtered out by the caller, so the venue simply carried no route through it
    // and said nothing. Say it — a curated entry that finds no pool is either a
    // config error or a pool nobody created.
    if (!address) {
      this.log.error(
        'v3_resolve_pool',
        `no pool for assets ${assetA}/${assetB} at fee ${fee} ` +
          `(token0 ${addr0}, token1 ${addr1}) — factory ${factory}`
      );
      return undefined;
    }

    return {
      address,
      fee,
      tickSpacing,
      token0: aIsToken0 ? assetA : assetB,
      token1: aIsToken0 ? assetB : assetA,
      addr0,
      addr1,
    };
  }

  // =============================================================================
  // Handlers
  // =============================================================================

  protected syncHandlers(): PoolEventHandler<UniswapV3PoolBase>[] {
    return [this.syncEvmLogHandler()];
  }

  /**
   * Pool activity — any `EVM.Log` emitted by a pool this venue routes through.
   *
   * - Matched on the emitting address, so swap/mint/burn need no decode
   * - Price, liquidity, ticks and reserves are re-read as one slice
   */
  private syncEvmLogHandler(): PoolEventHandler<UniswapV3PoolBase> {
    return {
      match: (e) =>
        e.pallet === 'EVM' &&
        e.method === 'Log' &&
        this.emittingPool(e.data) !== undefined,
      resolve: (e, block) => {
        const pool = this.emittingPool(e.data);
        if (!pool) return Promise.resolve([]);

        this.log.trace('evm.Log', pool.address);
        return this.sliceMutations(pool, block.hash);
      },
    };
  }

  /** The routed pool a log came from, if it came from one */
  private emittingPool(data: any): UniswapV3PoolBase | undefined {
    const address = data?.log?.address?.toLowerCase();
    if (!address) return undefined;
    return this.store.pools.find((p) => p.address.toLowerCase() === address);
  }

  // =============================================================================
  // Mutations
  // =============================================================================

  /**
   * Re-read a pool's slice, scoped to `at` (the event's block hash).
   *
   * @param pool - the pool the event touched
   * @param at - block the read is scoped to
   */
  private async sliceMutations(
    pool: UniswapV3PoolBase,
    at: string
  ): Promise<PoolMutation<UniswapV3PoolBase>[]> {
    const slice = await this.query.poolSlice.get(
      at,
      pool.address as `0x${string}`,
      pool.tickSpacing
    );

    return [
      {
        address: pool.address,
        apply: (p) => this.applySlice(p, slice),
      },
    ];
  }

  /** Fold a freshly read slice into a pool */
  private applySlice(
    pool: UniswapV3PoolBase,
    slice: V3PoolSlice
  ): UniswapV3PoolBase {
    const { reserve0, reserve1, ...state } = slice;
    return {
      ...pool,
      ...state,
      tokens: pool.tokens.map((t) =>
        t.id === pool.token0
          ? { ...t, balance: reserve0 }
          : { ...t, balance: reserve1 }
      ),
    };
  }
}
