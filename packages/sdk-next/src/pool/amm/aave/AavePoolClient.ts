import { AccountId } from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import { erc20, HYDRATION_SS58_PREFIX } from '@galacticcouncil/common';

import { AaveLog } from '../../../aave';

import { BlockRef } from '../../../api';

import { PoolEventHandler, PoolMutation } from '../../events';
import { PoolBase, PoolFees, PoolLimits, PoolType } from '../../types';
import { PoolClient } from '../../PoolClient';

import { AavePoolToken } from './AavePool';
import { AaveQuery } from './AaveQuery';
import { TRouterEvent, TRouterExecutedPayload } from './types';

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

  private getPoolId(reserve: number, atoken: number) {
    const id = reserve + '/' + atoken;
    const nameU8a = new TextEncoder().encode(id.padEnd(32, '\0'));
    const nameHex = toHex(nameU8a);
    return AccountId(HYDRATION_SS58_PREFIX).dec(nameHex);
  }

  private getPoolLimits(): PoolLimits {
    return {
      maxInRatio: 0n,
      maxOutRatio: 0n,
      minTradingLimit: 0n,
    } as PoolLimits;
  }

  async loadPools(block: BlockRef): Promise<PoolBase[]> {
    const at = block.hash;
    const entries = await this.query.pools.get(at);

    const pools = entries.map(
      async ({ reserve, atoken, liqudity_in, liqudity_out }) => {
        const [reserveMeta, reserveLocation, aTokenMeta, aTokenLocation] =
          await Promise.all([
            this.query.asset.get(at, reserve),
            this.query.assetLocation.get(at, reserve),
            this.query.asset.get(at, atoken),
            this.query.assetLocation.get(at, atoken),
          ]);

        return {
          address: this.getPoolId(reserve, atoken),
          type: PoolType.Aave,
          tokens: [
            {
              id: reserve,
              decimals: reserveMeta?.decimals,
              existentialDeposit: reserveMeta?.existential_deposit,
              balance: liqudity_in,
              location: reserveLocation,
              type: reserveMeta?.asset_type.type,
            } as AavePoolToken,
            {
              id: atoken,
              decimals: aTokenMeta?.decimals,
              existentialDeposit: aTokenMeta?.existential_deposit,
              balance: liqudity_out,
              location: aTokenLocation,
              type: aTokenMeta?.asset_type.type,
            } as AavePoolToken,
          ],
          ...this.getPoolLimits(),
        } as PoolBase;
      }
    );
    return Promise.all(pools);
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
    return [this.syncRouterHandler(), this.syncEvmLogHandler()];
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

  // =============================================================================
  // Reconcile
  // =============================================================================

  /**
   * Periodic reconcile — re-read every pool's reserves via the trade executor.
   *
   * - Both legs are interest-bearing and drift every block
   * - Reads pinned at the block being committed
   */
  protected reconcileBalances(
    block: BlockRef
  ): Promise<PoolMutation<PoolBase>[]> {
    return this.reserveMutations([...this.store.pools], block.hash);
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
