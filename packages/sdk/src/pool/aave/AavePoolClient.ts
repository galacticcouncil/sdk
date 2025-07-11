import type { Vec } from '@polkadot/types';
import { UnsubscribePromise } from '@polkadot/api-base/types';
import { encodeAddress } from '@polkadot/util-crypto';
import { stringToU8a } from '@polkadot/util';

import { decodeEventLog } from 'viem';

import { AAVE_POOL_ABI } from '../../aave';
import { HYDRADX_SS58_PREFIX } from '../../consts';

import { ERC20 } from '../../utils/erc20';
import { findNestedKey } from '../../utils/json';

import {
  PoolBase,
  PoolType,
  PoolLimits,
  PoolFees,
  PoolToken,
  PoolPair,
} from '../types';
import { PoolClient } from '../PoolClient';

import { AaveTradeExecutorPoolData } from './types';

const SYNC_MM_EVENTS = ['Supply', 'Withdraw', 'Repay', 'Borrow'];

export class AavePoolClient extends PoolClient {
  isSupported(): boolean {
    return this.api.call.aaveTradeExecutor.pools !== undefined;
  }

  async loadPools(): Promise<PoolBase[]> {
    const poolAssets =
      await this.api.call.aaveTradeExecutor.pools<
        Vec<AaveTradeExecutorPoolData>
      >();

    return poolAssets.map(({ reserve, atoken, liqudityIn, liqudityOut }) => {
      return {
        address: this.getPoolId(reserve.toString(), atoken.toString()),
        type: PoolType.Aave,
        tokens: [
          {
            id: reserve.toString(),
            balance: liqudityIn.toString(),
          } as PoolToken,
          {
            id: atoken.toString(),
            balance: liqudityOut.toString(),
          } as PoolToken,
        ],
        ...this.getPoolLimits(),
      } as PoolBase;
    });
  }

  async getPoolFees(
    _block: number,
    _poolPair: PoolPair,
    _poolAddress: string
  ): Promise<PoolFees> {
    return {} as PoolFees;
  }

  getPoolType(): PoolType {
    return PoolType.Aave;
  }

  private getPoolId(reserve: string, atoken: string): string {
    const id = reserve + '/' + atoken;
    return encodeAddress(stringToU8a(id.padEnd(32, '\0')), HYDRADX_SS58_PREFIX);
  }

  protected subscribePoolChange(pool: PoolBase): UnsubscribePromise {
    const [reserve, atoken] = pool.tokens;

    const reserveId = this.getReserveH160Id(reserve);

    return this.api.query.system.events((events) => {
      events.forEach((record) => {
        const { event } = record;
        const eventKey = `${event.section}:${event.method}`;

        if ('router:Executed' === eventKey) {
          const { assetIn, assetOut } = event.data.toHuman() as any;
          const aIn = assetIn.replace(/,/g, '');
          const aOut = assetOut.replace(/,/g, '');

          if (aIn === atoken.id || aOut === atoken.id) {
            this.log(`Sync AAVE [router:Executed] :: ${aIn}:${aOut}`);
            this.updatePoolState(pool);
          }
        }

        if ('evm:Log' === eventKey) {
          const { log } = event.data.toHuman() as any;
          try {
            const { eventName, args } = decodeEventLog({
              abi: AAVE_POOL_ABI,
              topics: log.topics,
              data: log.data,
            });
            if (
              SYNC_MM_EVENTS.includes(eventName) &&
              args.reserve.toLowerCase() === reserveId.toLowerCase()
            ) {
              this.log(
                `Sync AAVE [evm:Log] :: ${eventName} ${reserve.symbol}(${reserve.id})`
              );
              this.updatePoolState(pool);
            }
          } catch (e) {}
        }
      });
    });
  }

  private async updatePoolState(pool: PoolBase) {
    const [reserve, aToken] = pool.tokens;

    const { liqudityIn, liqudityOut } =
      await this.api.call.aaveTradeExecutor.pool<AaveTradeExecutorPoolData>(
        reserve.id,
        aToken.id
      );

    pool.tokens = pool.tokens.map((t) => {
      const balance =
        t.id === reserve.id ? liqudityIn.toString() : liqudityOut.toString();
      return {
        ...t,
        balance: balance,
      } as PoolToken;
    });
  }

  private getReserveH160Id(reserve: PoolToken) {
    if (reserve.type === 'Erc20') {
      const accountKey20 = findNestedKey(reserve.location, 'accountKey20');
      return accountKey20['accountKey20'].key;
    }
    return ERC20.fromAssetId(reserve.id);
  }

  private getPoolLimits(): PoolLimits {
    return {
      maxInRatio: 0,
      maxOutRatio: 0,
      minTradingLimit: 0,
    } as PoolLimits;
  }
}
