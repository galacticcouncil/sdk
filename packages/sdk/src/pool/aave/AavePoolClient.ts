import type { Vec } from '@polkadot/types';
import { UnsubscribePromise } from '@polkadot/api-base/types';
import { encodeAddress } from '@polkadot/util-crypto';
import { stringToU8a } from '@polkadot/util';

import { AaveTradeExecutorPoolData } from './types';

import { HYDRADX_SS58_PREFIX } from '../../consts';
import {
  PoolBase,
  PoolType,
  PoolLimits,
  PoolFees,
  PoolToken,
  PoolPair,
} from '../../types';

import { PoolClient } from '../PoolClient';

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

  async getPoolFees(_poolPair: PoolPair, _address: string): Promise<PoolFees> {
    return {} as PoolFees;
  }

  getPoolType(): PoolType {
    return PoolType.Aave;
  }

  private getPoolId(reserve: string, atoken: string): string {
    const id = reserve + '/' + atoken;
    return encodeAddress(stringToU8a(id.padEnd(32, '\0')), HYDRADX_SS58_PREFIX);
  }

  protected subscribePoolChange(_pool: PoolBase): UnsubscribePromise {
    throw new Error('Pool change subscription not supported!');
  }

  private getPoolLimits(): PoolLimits {
    return {
      maxInRatio: 0,
      maxOutRatio: 0,
      minTradingLimit: 0,
    } as PoolLimits;
  }
}
