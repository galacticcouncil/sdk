import { CompatibilityLevel } from 'polkadot-api';

import { type Observable } from 'rxjs';

import {
  PoolBase,
  PoolType,
  PoolFee,
  PoolLimits,
  PoolFees,
  PoolToken,
} from '../types';
import { PoolClient } from '../PoolClient';

import { XykPoolFees } from './XykPool';

export class XykPoolClient extends PoolClient {
  async isSupported(): Promise<boolean> {
    const query = this.api.query.XYK.PoolAssets;
    const compatibilityToken = await this.api.compatibilityToken;
    return query.isCompatible(
      CompatibilityLevel.BackwardsCompatible,
      compatibilityToken
    );
  }

  async loadPools(): Promise<PoolBase[]> {
    const query = this.api.query.XYK.PoolAssets;

    const [entries, limits] = await Promise.all([
      query.getEntries(),
      this.getPoolLimits(),
    ]);

    const pools = entries.map(async ({ keyArgs, value }) => {
      const [id] = keyArgs;
      const [x, y] = value;

      const [xBalance, yBalance] = await Promise.all([
        this.getBalance(id, x),
        this.getBalance(id, y),
      ]);

      return {
        address: id,
        type: PoolType.XYK,
        tokens: [
          {
            id: x,
            balance: xBalance,
          } as PoolToken,
          {
            id: y,
            balance: yBalance,
          } as PoolToken,
        ],
        ...limits,
      } as PoolBase;
    });
    return Promise.all(pools);
  }

  async getPoolFees(_address: string): Promise<PoolFees> {
    const exchangeFee = await this.getExchangeFee();
    return {
      exchangeFee: exchangeFee,
    } as XykPoolFees;
  }

  getPoolType(): PoolType {
    return PoolType.XYK;
  }

  protected subscribePoolChange(_pool: PoolBase): Observable<PoolBase> {
    throw new Error('Pool change subscription not supported!');
  }

  private async getExchangeFee(): Promise<PoolFee> {
    const fee = await this.api.constants.XYK.GetExchangeFee();
    return fee as PoolFee;
  }

  private async getPoolLimits(): Promise<PoolLimits> {
    const [maxInRatio, maxOutRatio, minTradingLimit] = await Promise.all([
      this.api.constants.XYK.MaxInRatio(),
      this.api.constants.XYK.MaxOutRatio(),
      this.api.constants.XYK.MinTradingLimit(),
    ]);

    return {
      maxInRatio: maxInRatio,
      maxOutRatio: maxOutRatio,
      minTradingLimit: minTradingLimit,
    } as PoolLimits;
  }
}
