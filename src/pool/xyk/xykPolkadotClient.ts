import { PolkadotClient } from '../../client';
import type { StorageKey } from '@polkadot/types';
import type { AnyTuple, Codec } from '@polkadot/types/types';
import { PoolBase, PoolToken, PoolType } from '../../types';

export class XykPolkadotClient extends PolkadotClient {
  async getPools(): Promise<PoolBase[]> {
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

  async getPoolTokens(poolAddress: string, assetKeys: string[]): Promise<PoolToken[]> {
    const poolTokens = assetKeys.map(async (id) => {
      const balance = await this.getBalance(poolAddress, id);
      const metadata = await super.getAssetMetadata(id);
      const metadataJson = metadata.toHuman();
      return {
        id,
        balance: balance,
        decimals: metadataJson.decimals,
        symbol: metadataJson.symbol,
      } as PoolToken;
    });
    return Promise.all(poolTokens);
  }

  getBalance(poolAddress: string, assetKey: string): Promise<string> {
    if (assetKey === '0') {
      return this.getSystemAccountBalance(poolAddress);
    } else {
      return this.getTokenAccountBalance(poolAddress, assetKey);
    }
  }

  getTradeFee(): string {
    const exchangeFee = this.api.consts.xyk.getExchangeFee;
    return ((exchangeFee[0].toNumber() / exchangeFee[1].toNumber()) * 100).toString();
  }
}
