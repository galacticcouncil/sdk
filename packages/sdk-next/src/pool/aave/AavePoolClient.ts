import { AccountId } from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import { Observable, map, merge, switchMap } from 'rxjs';
import { decodeEventLog } from 'viem';

import { PoolBase, PoolFees, PoolLimits, PoolPair, PoolType } from '../types';
import { PoolClient } from '../PoolClient';

import { HYDRATION_SS58_PREFIX } from '../../consts';
import { erc20, json } from '../../utils';

import { AavePoolToken } from './AavePool';
import { AAVE_ABI } from './AaveAbi';

const { ERC20 } = erc20;

const SYNC_MM_EVENTS = ['Supply', 'Withdraw', 'Repay', 'Borrow'];

export class AavePoolClient extends PoolClient<PoolBase> {
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

  async getPoolFees(pair: PoolPair, address: string): Promise<PoolFees> {
    return {} as PoolFees;
  }

  getPoolType(): PoolType {
    return PoolType.Aave;
  }

  async isSupported(): Promise<boolean> {
    return true;
  }

  subscribePoolChange(pool: PoolBase): Observable<PoolBase> {
    const [reserve, atoken] = pool.tokens as AavePoolToken[];

    const reserveH16Id = this.getReserveH160Id(reserve);

    const routerExecutedEvt = this.api.event.Router.Executed.watch(
      ({ asset_in, asset_out }) =>
        asset_in === atoken.id || asset_out === atoken.id
    );

    const evmLogEvt = this.api.event.EVM.Log.watch(({ log }) => {
      const { topics, data } = log;

      const topicsHex = topics.map((t) => t.asHex());
      const dataHex = data.asHex();

      const { eventName, args } = decodeEventLog({
        abi: AAVE_ABI,
        topics: topicsHex as any,
        data: dataHex as any,
      });

      return (
        SYNC_MM_EVENTS.includes(eventName) &&
        args.reserve.toLowerCase() === reserveH16Id.toLowerCase()
      );
    });

    return merge([routerExecutedEvt, evmLogEvt]).pipe(
      switchMap(() => {
        return this.getPoolDelta(pool);
      }),
      map((delta) => {
        return {
          ...pool,
          tokens: [...delta],
        };
      })
    );
  }

  private getReserveH160Id(reserve: AavePoolToken) {
    if (reserve.type === 'Erc20') {
      const accountKey20 = json.findNestedKey(reserve.location, 'AccountKey20');
      return accountKey20['AccountKey20'].key;
    }
    return ERC20.fromAssetId(reserve.id);
  }
}
