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
  async loadPools(): Promise<PoolBase[]> {
    const poolAssets = await this.api.query.xyk.poolAssets.entries();
    const pools = poolAssets.map(
      async ([
        {
          args: [id],
        },
        state,
      ]) => {
        const [assetA, assetB]: ITuple<[u32, u32]> = state.unwrap();

        return {
          address: id.toString(),
          type: PoolType.XYK,
          tokens: [
            {
              id: assetA.toString(),
            } as PoolToken,
            {
              id: assetB.toString(),
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

  protected subscribe(pool: PoolBase): UnsubscribePromise {
    const assetsArgs = pool.tokens.map((t) => t.id);
    return this.api.query.xyk.poolAssets.multi(assetsArgs, (_states) => {
      //do nothing
    });
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
