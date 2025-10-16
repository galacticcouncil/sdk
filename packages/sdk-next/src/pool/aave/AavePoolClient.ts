import { AccountId } from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import { Subscription, filter, finalize, map } from 'rxjs';
import { decodeEventLog } from 'viem';

import { PoolBase, PoolFees, PoolLimits, PoolType } from '../types';
import { PoolClient } from '../PoolClient';

import { HYDRATION_SS58_PREFIX } from '../../consts';
import { erc20, json } from '../../utils';

import { AavePoolToken } from './AavePool';
import { AAVE_ABI } from './AaveAbi';
import {
  TRouterEvent,
  TRouterExecutedPayload,
  TEvmEvent,
  TEvmPayload,
} from './types';

const { ERC20 } = erc20;

const SYNC_MM_EVENTS = ['Supply', 'Withdraw', 'Repay', 'Borrow'];

export class AavePoolClient extends PoolClient<PoolBase> {
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

  async loadPools(): Promise<PoolBase[]> {
    const entries = await this.api.apis.AaveTradeExecutor.pools();

    const pools = entries.map(
      async ({ reserve, atoken, liqudity_in, liqudity_out }) => {
        const [reserveMeta, reserveLocation, aTokenMeta, aTokenLocation] =
          await Promise.all([
            this.api.query.AssetRegistry.Assets.getValue(reserve),
            this.api.query.AssetRegistry.AssetLocations.getValue(reserve),
            this.api.query.AssetRegistry.Assets.getValue(atoken),
            this.api.query.AssetRegistry.AssetLocations.getValue(atoken),
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

  private async getPoolDelta(pool: PoolBase): Promise<AavePoolToken[]> {
    const [reserve, aToken] = pool.tokens;

    const { liqudity_in, liqudity_out } =
      await this.api.apis.AaveTradeExecutor.pool(reserve.id, aToken.id);

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
        return value.key.asHex();
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

  private parseEvmLog(payload: TEvmPayload): TEvmEvent | undefined {
    const { topics, data } = payload.log;
    const topicsHex = topics.map((t) => t.asHex());
    const dataHex = data.asHex();

    try {
      const { eventName, args } = decodeEventLog({
        abi: AAVE_ABI,
        topics: topicsHex as any,
        data: dataHex as any,
      });

      const reserve = args.reserve.toLowerCase();

      return {
        eventName,
        reserve,
        key: `${eventName}:${reserve}`,
      };
    } catch {
      return undefined;
    }
  }

  private subscribeRouterExecuted(): Subscription {
    const pools = this.store.pools;

    const aTokens = pools
      .map((p) => p.tokens)
      .map(([_reserve, aToken]) => aToken)
      .map((a) => a.id);

    return this.api.event.Router.Executed.watch()
      .pipe(
        map(({ payload }) => this.parseRouterLog(payload)),
        filter(
          ({ assetIn, assetOut }) =>
            aTokens.includes(assetIn) || aTokens.includes(assetOut)
        ),
        finalize(() => {
          this.log(this.getPoolType(), 'unsub router executed');
        })
      )
      .subscribe(({ assetIn, assetOut, key }) => {
        this.log(this.getPoolType(), '[router:Executed]', key);

        this.store.update(async (pools) => {
          const updated: PoolBase[] = [];

          for (const pool of pools) {
            const [_reserve, aToken] = pool.tokens;
            const shouldSync = aToken.id === assetIn || aToken.id === assetOut;
            if (shouldSync) {
              const tokens = await this.getPoolDelta(pool);
              updated.push({
                ...pool,
                tokens: tokens,
              });
            }
          }
          return updated;
        });
      });
  }

  private subscribeEvmLog(): Subscription {
    return this.api.event.EVM.Log.watch()
      .pipe(
        map(({ payload }) => this.parseEvmLog(payload)),
        filter((v): v is TEvmEvent => v !== undefined),
        filter(({ eventName }) => SYNC_MM_EVENTS.includes(eventName)),
        finalize(() => {
          this.log(this.getPoolType(), 'unsub evm log');
        })
      )
      .subscribe(({ reserve: evtReserve, key }) => {
        this.log(this.getPoolType(), '[evm:Log]', key);

        this.store.update(async (pools) => {
          const updated: PoolBase[] = [];

          for (const pool of pools) {
            const [reserve] = pool.tokens as AavePoolToken[];
            const poolReserve = this.getReserveH160Id(reserve).toLowerCase();

            if (poolReserve === evtReserve) {
              const tokens = await this.getPoolDelta(pool);
              updated.push({
                ...pool,
                tokens: tokens,
              });
            }
          }
          return updated;
        });
      });
  }

  protected override subscribeBalances(): Subscription {
    return Subscription.EMPTY;
  }

  protected subscribeUpdates(): Subscription {
    const sub = new Subscription();

    sub.add(this.subscribeRouterExecuted());
    sub.add(this.subscribeEvmLog());

    return sub;
  }
}
