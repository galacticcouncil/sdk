import { CompatibilityLevel } from 'polkadot-api';

import { Subscription } from 'rxjs';

import {
  PoolBase,
  PoolType,
  PoolFee,
  PoolLimits,
  PoolFees,
  PoolToken,
  PoolTokenOverride,
} from '../types';
import { PoolClient } from '../PoolClient';

import { XykPoolFees } from './XykPool';

export class XykPoolClient extends PoolClient<PoolBase> {
  getPoolType(): PoolType {
    return PoolType.XYK;
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

  async isSupported(): Promise<boolean> {
    const query = this.api.query.XYK.PoolAssets;
    const compatibilityToken = await this.api.compatibilityToken;
    return query.isCompatible(
      CompatibilityLevel.BackwardsCompatible,
      compatibilityToken
    );
  }

  async loadPools(override: PoolTokenOverride[]): Promise<PoolBase[]> {
    const query = this.api.query.XYK.PoolAssets;

    const [entries, limits] = await Promise.all([
      query.getEntries(),
      this.getPoolLimits(),
    ]);

    const decimals = new Map(override.map((p) => [p.id, p.decimals]));
    const pools = entries.map(async ({ keyArgs, value }) => {
      const [id] = keyArgs;
      const [x, y] = value;

      const [xBalance, xMeta, yBalance, yMeta] = await Promise.all([
        this.getBalance(id, x),
        this.api.query.AssetRegistry.Assets.getValue(x),
        this.getBalance(id, y),
        this.api.query.AssetRegistry.Assets.getValue(y),
      ]);

      return {
        address: id,
        type: PoolType.XYK,
        tokens: [
          {
            id: x,
            decimals: xMeta?.decimals || decimals.get(x),
            existentialDeposit: xMeta?.existential_deposit,
            balance: xBalance.transferable,
            type: xMeta?.asset_type.type,
          } as PoolToken,
          {
            id: y,
            decimals: yMeta?.decimals || decimals.get(y),
            existentialDeposit: yMeta?.existential_deposit,
            balance: yBalance.transferable,
            type: yMeta?.asset_type.type,
          } as PoolToken,
        ],
        ...limits,
      } as PoolBase;
    });
    return Promise.all(pools);
  }

  async getPoolFees(): Promise<PoolFees> {
    const exchangeFee = await this.getExchangeFee();
    return {
      exchangeFee: exchangeFee,
    } as XykPoolFees;
  }

  private async getExchangeFee(): Promise<PoolFee> {
    const fee = await this.api.constants.XYK.GetExchangeFee();
    return fee as PoolFee;
  }

  protected subscribeUpdates(): Subscription {
    return Subscription.EMPTY;
  }
}
