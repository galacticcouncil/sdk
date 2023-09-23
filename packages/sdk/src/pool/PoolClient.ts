import { ApiPromise } from '@polkadot/api';
import type { StorageKey } from '@polkadot/types';
import type { AnyTuple, Codec } from '@polkadot/types/types';
import type { PoolBase, PoolFees, PoolToken } from '../types';

import { BalanceClient } from '../client';

export abstract class PoolClient extends BalanceClient {
  constructor(api: ApiPromise) {
    super(api);
  }

  abstract getPools(): Promise<PoolBase[]>;
  abstract getPoolFees(feeAsset: string, address: string): Promise<PoolFees>;

  protected getStorageKey(asset: [StorageKey<AnyTuple>, Codec], index: number): string {
    return (asset[0].toHuman() as string[])[index];
  }

  protected getStorageEntryArray(asset: [StorageKey<AnyTuple>, Codec]): string[] {
    return asset[1].toHuman() as string[];
  }

  protected async getPoolTokens(poolAddress: string, assetKeys: string[]): Promise<PoolToken[]> {
    const poolTokens = assetKeys.map(async (id) => {
      const balance = await this.getAccountBalance(poolAddress, id);
      const metadata = await this.getAssetMetadata(id);
      return {
        id: id,
        balance: balance.amount.toString(),
        decimals: metadata.decimals,
        symbol: metadata.symbol,
        icon: metadata.icon,
        meta: metadata.meta,
      } as PoolToken;
    });
    return Promise.all(poolTokens);
  }

  protected async syncPoolTokens(poolAddress: string, poolTokens: PoolToken[]): Promise<PoolToken[]> {
    const syncedPoolTokens = poolTokens.map(async (poolToken: PoolToken) => {
      const balance = await this.getAccountBalance(poolAddress, poolToken.id);
      return {
        ...poolToken,
        balance: balance.amount.toString(),
      } as PoolToken;
    });
    return Promise.all(syncedPoolTokens);
  }
}
