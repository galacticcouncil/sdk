import type { u32 } from '@polkadot/types';
import type { ITuple } from '@polkadot/types/types';
import { UnsubscribePromise } from '@polkadot/api-base/types';

import { FeeUtils } from '../../utils/fee';

import {
  PoolBase,
  PoolType,
  PoolFee,
  PoolLimits,
  PoolFees,
  PoolToken,
  PoolPair,
} from '../types';
import { PoolClient } from '../PoolClient';

import { XykPoolFees } from './XykPool';

export class XykPoolClient extends PoolClient {
  getPoolType(): PoolType {
    return PoolType.XYK;
  }

  private getPoolLimits(): PoolLimits {
    const maxInRatio = this.api.consts.xyk.maxInRatio.toNumber();
    const maxOutRatio = this.api.consts.xyk.maxOutRatio.toNumber();
    const minTradingLimit = this.api.consts.xyk.minTradingLimit.toNumber();
    return {
      maxInRatio: maxInRatio,
      maxOutRatio: maxOutRatio,
      minTradingLimit: minTradingLimit,
    } as PoolLimits;
  }

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

  async getPoolFees(
    _block: number,
    _poolPair: PoolPair,
    _poolAddress: string
  ): Promise<PoolFees> {
    return {
      exchangeFee: this.getExchangeFee(),
    } as XykPoolFees;
  }

  private getExchangeFee(): PoolFee {
    const [numerator, denominator] = this.api.consts.xyk.getExchangeFee;
    return FeeUtils.fromRate(numerator.toNumber(), denominator.toNumber());
  }

  protected async subscribeUpdates(): UnsubscribePromise {
    return () => {};
  }
}
