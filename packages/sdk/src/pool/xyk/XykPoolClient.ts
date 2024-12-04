import type { u32 } from '@polkadot/types';
import type { ITuple } from '@polkadot/types/types';
import { UnsubscribePromise } from '@polkadot/api-base/types';
import {
  PoolBase,
  PoolType,
  PoolFee,
  PoolLimits,
  PoolFees,
  PoolToken,
} from '../../types';

import { XykPoolFees } from './XykPool';

import { PoolClient } from '../PoolClient';

export class XykPoolClient extends PoolClient {
  isSupported(): boolean {
    return this.api.query.xyk !== undefined;
  }

  async loadPools(): Promise<PoolBase[]> {
    const poolAssets = await this.api.query.xyk.poolAssets.entries();
    const pools = poolAssets.map(
      async ([
        {
          args: [id],
        },
        state,
      ]) => {
        const poolAddress = id.toString();
        const [assetA, assetB]: ITuple<[u32, u32]> = state.unwrap();
        const [assetABalance, assetBBalance] = await Promise.all([
          this.getBalance(poolAddress, assetA.toString()),
          this.getBalance(poolAddress, assetB.toString()),
        ]);

        return {
          address: poolAddress,
          type: PoolType.XYK,
          tokens: [
            {
              id: assetA.toString(),
              balance: assetABalance.toString(),
            } as PoolToken,
            {
              id: assetB.toString(),
              balance: assetBBalance.toString(),
            } as PoolToken,
          ],
          ...this.getPoolLimits(),
        } as PoolBase;
      }
    );
    return Promise.all(pools);
  }

  async getPoolFees(_feeAsset: string, _address: string): Promise<PoolFees> {
    return {
      exchangeFee: this.getExchangeFee(),
    } as XykPoolFees;
  }

  getPoolType(): PoolType {
    return PoolType.XYK;
  }

  protected subscribePoolChange(_pool: PoolBase): UnsubscribePromise {
    throw new Error('Pool change subscription not supported!');
  }

  private getExchangeFee(): PoolFee {
    const exFee = this.api.consts.xyk.getExchangeFee;
    return exFee.toJSON() as PoolFee;
  }

  private getPoolLimits(): PoolLimits {
    const maxInRatio = this.api.consts.xyk.maxInRatio.toJSON() as number;
    const maxOutRatio = this.api.consts.xyk.maxOutRatio.toJSON() as number;
    const minTradingLimit =
      this.api.consts.xyk.minTradingLimit.toJSON() as number;
    return {
      maxInRatio: maxInRatio,
      maxOutRatio: maxOutRatio,
      minTradingLimit: minTradingLimit,
    } as PoolLimits;
  }
}
