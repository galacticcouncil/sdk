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

interface AssetDetail extends Struct {
  readonly name: string;
  readonly assetType: string;
  readonly existentialDeposit: Balance;
  readonly locked: boolean;
}

const DEFAULT_DECIMALS = 12;

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

      // Fallback if missing assetMetadata entry
      if (metadataJson == null) {
        const detail = await this.getAssetDetail(id);
        const detailJson = detail.toHuman();
        return {
          id: id.toString(),
          balance: balance,
          decimals: DEFAULT_DECIMALS,
          symbol: detailJson.name,
        } as PoolToken;
      }

      return {
        id: id.toString(),
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

  async getAssetDetail(tokenKey: string): Promise<AssetDetail> {
    return await this.api.query.assetRegistry.assets<AssetDetail>(tokenKey);
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
