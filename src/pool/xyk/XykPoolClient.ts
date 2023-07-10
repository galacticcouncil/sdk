import type { StorageKey } from '@polkadot/types';
import type { AnyTuple, Codec } from '@polkadot/types/types';
import { PoolBase, PoolType, PoolFee, PoolLimits, PoolFees } from '../../types';

import { PoolClient } from '../PoolClient';
import { XykPoolFees } from './XykPool';

export class XykPoolClient extends PoolClient {
  private pools: PoolBase[] = [];
  private _poolsLoaded = false;

  async getPools(): Promise<PoolBase[]> {
    if (this._poolsLoaded) {
      this.pools = await this.syncPools();
    } else {
      this.pools = await this.loadPools();
      this._poolsLoaded = true;
    }
    return this.pools;
  }

  private async loadPools(): Promise<PoolBase[]> {
    const poolAssets = await this.api.query.xyk.poolAssets.entries();
    const pools = poolAssets.map(async (asset: [StorageKey<AnyTuple>, Codec]) => {
      const poolAddress = this.getStorageKey(asset, 0);
      const poolEntries = this.getStorageEntryArray(asset);
      const poolTokens = await this.getPoolTokens(poolAddress, poolEntries);
      const poolFees = this.getPoolFees();
      return {
        address: poolAddress,
        type: PoolType.XYK,
        fees: poolFees,
        tokens: poolTokens,
        ...this.getPoolLimits(),
      } as PoolBase;
    });
    return Promise.all(pools);
  }

  private async syncPools(): Promise<PoolBase[]> {
    const syncedPools = this.pools.map(async (pool: PoolBase) => {
      return {
        ...pool,
        tokens: await this.syncPoolTokens(pool.address, pool.tokens),
      } as PoolBase;
    });
    return Promise.all(syncedPools);
  }

  getPoolFees(): PoolFees {
    return {
      exchangeFee: this.getExchangeFee(),
    } as XykPoolFees;
  }

  getExchangeFee(): PoolFee {
    const exFee = this.api.consts.xyk.getExchangeFee;
    return exFee.toJSON() as PoolFee;
  }

  getPoolLimits(): PoolLimits {
    const maxInRatio = this.api.consts.xyk.maxInRatio.toJSON() as number;
    const maxOutRatio = this.api.consts.xyk.maxOutRatio.toJSON() as number;
    const minTradingLimit = this.api.consts.xyk.minTradingLimit.toJSON() as number;
    return { maxInRatio: maxInRatio, maxOutRatio: maxOutRatio, minTradingLimit: minTradingLimit } as PoolLimits;
  }
}
