import type { Vec } from '@polkadot/types';
import type { FrameSystemEventRecord } from '@polkadot/types/lookup';
import { UnsubscribePromise } from '@polkadot/api-base/types';
import { encodeAddress } from '@polkadot/util-crypto';
import { stringToU8a } from '@polkadot/util';

import { decodeEventLog } from 'viem';

import {
  PoolBase,
  PoolType,
  PoolLimits,
  PoolFees,
  PoolToken,
  PoolPair,
} from '../types';
import { PoolClient } from '../PoolClient';

import { AAVE_POOL_ABI } from '../../aave';
import { HYDRADX_SS58_PREFIX } from '../../consts';
import { EvmLogEvent } from '../../evm';
import { ERC20 } from '../../utils/erc20';
import { findNestedKey } from '../../utils/json';

import { AaveTradeExecutorPoolData, RouterExecutedEvent } from './types';

const SYNC_MM_EVENTS = ['Supply', 'Withdraw', 'Repay', 'Borrow'];

export class AavePoolClient extends PoolClient {
  getPoolType(): PoolType {
    return PoolType.Aave;
  }

  private getPoolId(reserve: string, atoken: string): string {
    const id = 'aave:' + reserve + '/' + atoken;
    return encodeAddress(stringToU8a(id.padEnd(32, '\0')), HYDRADX_SS58_PREFIX);
  }

  private getPoolLimits(): PoolLimits {
    return {
      maxInRatio: 0,
      maxOutRatio: 0,
      minTradingLimit: 0,
    } as PoolLimits;
  }

  private getReserveH160Id(reserve: PoolToken): string {
    if (reserve.type === 'Erc20') {
      const accountKey20 = findNestedKey(reserve.location, 'accountKey20');
      return accountKey20['accountKey20'].key;
    }
    return ERC20.fromAssetId(reserve.id);
  }

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

  protected onEvents(events: Vec<FrameSystemEventRecord>): void {
    events.forEach((record) => {
      const { event } = record;
      const eventKey = `${event.section}:${event.method}`;

      if (eventKey === 'router:Executed') {
        const [assetIn, assetOut] = event.data.toJSON() as RouterExecutedEvent;
        this.pools
          .filter((pool) =>
            pool.tokens.some(
              (t) => t.id === assetIn.toString() || t.id === assetOut.toString()
            )
          )
          .forEach((pool) => {
            this.log(
              `Sync AAVE via [router:Executed] :: ${assetIn}:${assetOut}`
            );
            this.updatePoolState(pool);
          });
      }

      if (eventKey === 'evm:Log') {
        const [log] = event.data.toJSON() as EvmLogEvent;
        try {
          const { eventName, args } = decodeEventLog({
            abi: AAVE_POOL_ABI,
            topics: log.topics,
            data: log.data,
          });

          if (SYNC_MM_EVENTS.includes(eventName)) {
            const evtReserveId = args.reserve.toLowerCase();
            this.pools
              .filter((pool) => {
                const [reserve] = pool.tokens;
                const reserveId = this.getReserveH160Id(reserve).toLowerCase();
                return reserveId === evtReserveId;
              })
              .forEach((pool) => {
                this.log(
                  `Sync AAVE via [evm:Log] :: ${eventName} ${evtReserveId}`
                );
                this.updatePoolState(pool);
              });
          }
        } catch (e) {}
      }
    });
  }

  protected async subscribeBalances(): UnsubscribePromise {
    return () => {};
  }

  protected async subscribeUpdates(): UnsubscribePromise {
    return () => {};
  }

  protected async updatePoolState(pool: PoolBase) {
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
}
