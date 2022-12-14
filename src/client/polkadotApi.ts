import { ApiPromise } from '@polkadot/api';

import type { StorageKey } from '@polkadot/types';
import type { AnyTuple, Codec } from '@polkadot/types/types';
import type { AssetMetadata } from '@polkadot/types/interfaces';
import type { Balance } from '@polkadot/types/interfaces/runtime';
import type { Struct } from '@polkadot/types-codec';
import type { PoolToken } from '../types';
import { SYSTEM_ASSET_ID } from '../consts';
import '@polkadot/api-augment';

interface TokensAccountData extends Struct {
  readonly free: Balance;
  readonly reserved: Balance;
  readonly frozen: Balance;
}

interface AccountInfo extends Struct {
  readonly nonce: number;
  readonly consumers: number;
  readonly providers: number;
  readonly sufficients: number;
  readonly data: AccountData;
}

interface AccountData extends Struct {
  readonly free: Balance;
  readonly reserved: Balance;
  readonly miscFrozen: Balance;
  readonly feeFrozen: Balance;
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

      if (SYSTEM_ASSET_ID == id) {
        const defaultDecimals = this.api.registry.chainDecimals[0];
        const defaultAsset = this.api.registry.chainTokens[0];
        return {
          id: id,
          balance: balance,
          decimals: defaultDecimals,
          symbol: defaultAsset,
        } as PoolToken;
      }

      return {
        id: id,
        balance: balance,
        decimals: metadataJson.decimals,
        symbol: metadataJson.symbol,
      } as PoolToken;
    });
    return Promise.all(poolTokens);
  }

  async syncPoolTokens(poolAddress: string, poolTokens: PoolToken[]): Promise<PoolToken[]> {
    const syncedPoolTokens = poolTokens.map(async (poolToken: PoolToken) => {
      const balance = await this.getAccountBalance(poolAddress, poolToken.id);
      return {
        ...poolToken,
        balance: balance,
      } as PoolToken;
    });
    return Promise.all(syncedPoolTokens);
  }

  async getAssetMetadata(tokenKey: string): Promise<AssetMetadata> {
    return await this.api.query.assetRegistry.assetMetadataMap<AssetMetadata>(tokenKey);
  }

  async getAccountBalance(accountId: string, tokenKey: string): Promise<string> {
    return tokenKey === SYSTEM_ASSET_ID
      ? await this.getSystemAccountBalance(accountId)
      : await this.getTokenAccountBalance(accountId, tokenKey);
  }

  async getSystemAccountBalance(accountId: string): Promise<string> {
    const {
      data: { free },
    } = await this.api.query.system.account<AccountInfo>(accountId);
    return free.toString();
  }

  async getTokenAccountBalance(accountId: string, tokenKey: string): Promise<string> {
    const { free } = await this.api.query.tokens.accounts<TokensAccountData>(accountId, tokenKey);
    return free.toString();
  }
}
