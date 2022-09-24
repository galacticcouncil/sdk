import { ApiPromise } from '@polkadot/api';

import type { StorageKey } from '@polkadot/types';
import type { AnyTuple, Codec } from '@polkadot/types/types';
import type { AssetMetadata } from '@polkadot/types/interfaces';
import type { Balance } from '@polkadot/types/interfaces/runtime';
import type { Struct } from '@polkadot/types-codec';
import type { PoolToken } from '../types';
import '@polkadot/api-augment';

interface TokensAccountData extends Struct {
  readonly free: Balance;
  readonly reserved: Balance;
  readonly frozen: Balance;
}

export class PolkadotApiClient {
  protected readonly api: ApiPromise;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  getStorageKey(asset: [StorageKey<AnyTuple>, Codec], index: number): string {
    return (asset[0].toHuman() as string[])[index];
  }

  getStorageEntryArray(asset: [StorageKey<AnyTuple>, Codec]): string[] {
    return asset[1].toHuman() as string[];
  }

  async getPoolTokens(poolAddress: string, assetKeys: string[]): Promise<PoolToken[]> {
    const poolTokens = assetKeys.map(async (id) => {
      const balance = await this.getAccountBalance(poolAddress, id);
      const metadata = await this.getAssetMetadata(id);
      const metadataJson = metadata.toHuman();
      return {
        id: id.toString(),
        balance: balance,
        decimals: metadataJson.decimals,
        symbol: metadataJson.symbol,
      } as PoolToken;
    });
    return Promise.all(poolTokens);
  }

  async getAssetMetadata(tokenKey: string): Promise<AssetMetadata> {
    return await this.api.query.assetRegistry.assetMetadataMap<AssetMetadata>(tokenKey);
  }

  async getAccountBalance(accountId: string, tokenKey: string): Promise<string> {
    return tokenKey === '0'
      ? await this.getSystemAccountBalance(accountId)
      : await this.getTokenAccountBalance(accountId, tokenKey);
  }

  async getSystemAccountBalance(accountId: string): Promise<string> {
    const {
      data: { free },
    } = await this.api.query.system.account(accountId);
    return free.toString();
  }

  async getTokenAccountBalance(accountId: string, tokenKey: string): Promise<string> {
    const { free } = await this.api.query.tokens.accounts<TokensAccountData>(accountId, tokenKey);
    return free.toString();
  }
}
