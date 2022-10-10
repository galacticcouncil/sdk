import type { StorageKey } from '@polkadot/types';
import type { AnyTuple, Codec } from '@polkadot/types/types';
import { PolkadotApiClient } from '../../client';
import { PoolBase, PoolType, PoolFee, PoolToken } from '../../types';

export class XykPolkadotApiClient extends PolkadotApiClient {
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

  async loadPools(): Promise<PoolBase[]> {
    const poolAssets = await this.api.query.xyk.poolAssets.entries();
    const pools = poolAssets.map(async (asset: [StorageKey<AnyTuple>, Codec]) => {
      const poolAddress = this.getStorageKey(asset, 0);
      const poolEntries = this.getStorageEntryArray(asset);
      const poolTokens = await this.getPoolTokens(poolAddress, poolEntries);
      return {
        address: poolAddress,
        type: PoolType.XYK,
        tradeFee: this.getTradeFee(),
        tokens: poolTokens,
      } as PoolBase;
    });
    return Promise.all(pools);
  }

  async syncPools(): Promise<PoolBase[]> {
    const syncedPools = this.pools.map(async (pool: PoolBase) => {
      return {
        ...pool,
        tokens: await this.syncPoolTokens(pool.address, pool.tokens),
      } as PoolBase;
    });
    return Promise.all(syncedPools);
  }

  getTradeFee(): PoolFee {
    const exFee = this.api.consts.xyk.getExchangeFee;
    return exFee.toJSON() as PoolFee;
  }
}
