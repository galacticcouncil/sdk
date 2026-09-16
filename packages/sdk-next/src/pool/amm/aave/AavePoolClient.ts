import { erc20 } from '@galacticcouncil/common';

import { AAVE_POOL_PROXY, AaveLog } from '../../../aave';

import { BlockRef } from '../../../api';

import { PoolEventHandler, PoolMutation } from '../../events';
import { PoolBase, PoolFees, PoolType } from '../../types';
import { PoolClient } from '../../PoolClient';
import { TAssetLocation } from '../../PoolQuery';

import { contractIndex } from '../assetAddress';

import { AavePoolToken } from './AavePool';
import { AaveQuery } from './AaveQuery';
import { pairReserves, toAavePool } from './AaveReserves';
import { TAavePools, TRouterEvent, TRouterExecutedPayload } from './types';

const { ERC20 } = erc20;

const SYNC_MM_EVENTS = ['Supply', 'Withdraw', 'Repay', 'Borrow'];

export class AavePoolClient extends PoolClient<PoolBase> {
  protected readonly query = new AaveQuery(this.client, this.evm);

  getPoolType(): PoolType {
    return PoolType.Aave;
  }

  async isSupported(): Promise<boolean> {
    return true;
  }

  async loadPools(block: BlockRef): Promise<PoolBase[]> {
    const at = block.hash;

    const [pairs, assets, locations] = await Promise.all([
      this.query.pools.get(at),
      this.query.assets.get(at),
      this.query.assetLocations.get(at),
    ]);

    const entries =
      pairs.length > 0
        ? pairs
        : await this.loadPairsFromMarket(block, locations);

    return entries.map(({ reserve, atoken, liqudity_in, liqudity_out }) =>
      toAavePool(
        { reserveId: reserve, atokenId: atoken },
        { liqudity_in, liqudity_out },
        assets,
        locations
      )
    );
  }

  /**
   * Reserve pairs read from the money market itself.
   *
   * - `AaveTradeExecutor.pools` walks the reserve list under a fixed view gas
   *   budget and returns nothing once the list outgrows it
   * - The reserve list and each aToken come from the pool contract through
   *   the adapter, pinned at the same block with its full gas budget
   * - Liquidity comes from the per-pair runtime call, which is unaffected
   * - A pair the registry does not know, or whose read fails, is skipped
   *
   * @param block - the block every read pins to
   * @param locations - registry locations, keyed by id
   */
  private async loadPairsFromMarket(
    block: BlockRef,
    locations: Map<number, TAssetLocation>
  ): Promise<TAavePools> {
    const at = block.hash;
    const pool = AAVE_POOL_PROXY.toLowerCase() as `0x${string}`;

    const reserves = await this.query.reserves.get(at, pool);
    const atokens = new Map(
      await Promise.all(
        reserves.map(
          async (reserve) =>
            [
              reserve,
              await this.query.reserveAToken.get(at, pool, reserve),
            ] as const
        )
      )
    );

    const { pairs, skipped } = pairReserves(
      reserves,
      atokens,
      contractIndex(locations)
    );

    const results = await Promise.allSettled(
      pairs.map(({ reserveId, atokenId }) =>
        this.query.pool.get(at, reserveId, atokenId)
      )
    );

    const pools = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value);

    this.log.info('pool_fallback', {
      reserves: reserves.length,
      skipped: skipped.length,
      pools: pools.length,
    });
    return pools;
  }

  private async getPoolDelta(
    pool: PoolBase,
    at: string
  ): Promise<AavePoolToken[]> {
    const [reserve, aToken] = pool.tokens;

    const { liqudity_in, liqudity_out } = await this.query.pool.get(
      at,
      reserve.id,
      aToken.id
    );

    return pool.tokens.map((t) => {
      const balance = t.id === reserve.id ? liqudity_in : liqudity_out;
      return {
        ...t,
        balance: balance,
      } as AavePoolToken;
    });
  }

  async getPoolFees(): Promise<PoolFees> {
    return {} as PoolFees;
  }

  private getReserveH160Id(reserve: AavePoolToken) {
    if (reserve.type === 'Erc20' && reserve.location) {
      const interior = reserve.location.interior;
      if (interior.type === 'X1' && interior.value.type === 'AccountKey20') {
        const { value } = interior.value;
        return value.key;
      }
      throw new Error('Invalid aave reserve multilocation');
    }
    return ERC20.fromAssetId(reserve.id);
  }

  private parseRouterLog(payload: TRouterExecutedPayload): TRouterEvent {
    const { asset_in, asset_out } = payload;

    return {
      assetIn: asset_in,
      assetOut: asset_out,
      key: `${asset_in}:${asset_out}`,
    };
  }

  // =============================================================================
  // Handlers
  // =============================================================================

  protected syncHandlers(): PoolEventHandler<PoolBase>[] {
    return [
      this.syncRouterHandler(),
      this.syncEvmLogHandler(),
      this.syncLiquidationHandler(),
    ];
  }

  /**
   * Router trades — `Router.Executed`.
   *
   * - Sync any pool whose aToken is the traded in/out asset
   * - Re-read reserves via the trade executor, pinned at the event's block
   */
  private syncRouterHandler(): PoolEventHandler<PoolBase> {
    return {
      match: (e) => e.pallet === 'Router' && e.method === 'Executed',
      resolve: (e, block) => {
        const { assetIn, assetOut } = this.parseRouterLog(
          e.data as TRouterExecutedPayload
        );
        const pools = this.store.pools.filter((pool) => {
          const [, aToken] = pool.tokens;
          return aToken.id === assetIn || aToken.id === assetOut;
        });
        if (pools.length > 0) {
          this.log.trace('trade', { assetIn, assetOut, pools: pools.length });
        }
        return this.reserveMutations(pools, block.hash);
      },
    };
  }

  /**
   * Money-market activity — `EVM.Log` Supply/Withdraw/Repay/Borrow.
   *
   * - Matched on `topic0`, so an unrelated log is skipped without decoding
   * - Match the pool by its reserve's H160 address
   * - Re-read reserves via the trade executor, pinned at the event's block
   */
  private syncEvmLogHandler(): PoolEventHandler<PoolBase> {
    return {
      match: (e) =>
        e.pallet === 'EVM' &&
        e.method === 'Log' &&
        SYNC_MM_EVENTS.includes(AaveLog.eventName(e.data)),
      resolve: (e, block) => {
        const ev = AaveLog.parse(e.data);
        if (!ev) {
          return Promise.resolve([]);
        }
        const pools = this.store.pools.filter((pool) => {
          const [reserve] = pool.tokens as AavePoolToken[];
          return this.getReserveH160Id(reserve).toLowerCase() === ev.reserve;
        });
        if (pools.length > 0) {
          this.log.trace(ev.eventName.toLowerCase(), { pools: pools.length });
        }
        return this.reserveMutations(pools, block.hash);
      },
    };
  }

  /**
   * Liquidations — `Liquidation.Liquidated`.
   *
   * - Repaid debt raises its reserve's liquidity, seized collateral lowers it,
   *   so both legs are re-read
   * - The event names both assets as registry ids, so no log decode is needed
   * - Re-read reserves via the trade executor, pinned at the event's block
   */
  private syncLiquidationHandler(): PoolEventHandler<PoolBase> {
    return {
      match: (e) => e.pallet === 'Liquidation' && e.method === 'Liquidated',
      resolve: (e, block) => {
        const collateral = e.data.collateral_asset as number;
        const debt = e.data.debt_asset as number;

        const pools = this.store.pools.filter((pool) => {
          const [reserve] = pool.tokens;
          return reserve.id === collateral || reserve.id === debt;
        });
        if (pools.length > 0) {
          this.log.trace('liquidation', {
            assets: [collateral, debt],
            pools: pools.length,
          });
        }
        return this.reserveMutations(pools, block.hash);
      },
    };
  }

  // =============================================================================
  // Mutations
  // =============================================================================

  /**
   * Re-read reserves for the given pools, PINNED at `at` (the event's block hash).
   *
   * - Reads both legs via the trade executor so they can't tear
   * - One mutation per pool
   */
  private async reserveMutations(
    pools: PoolBase[],
    at: string
  ): Promise<PoolMutation<PoolBase>[]> {
    return Promise.all(
      pools.map(async (pool) => {
        const tokens = await this.getPoolDelta(pool, at);
        return {
          address: pool.address,
          apply: (p: PoolBase) => ({ ...p, tokens }),
        };
      })
    );
  }
}
