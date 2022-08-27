import { PolkadotClient } from "../../clients/polkadot";
import { XykClient } from "./xykClient";
import type { StorageKey } from "@polkadot/types";
import type { AnyTuple, Codec } from "@polkadot/types/types";
import type { PoolAsset } from "../../types";
import "@polkadot/api-augment";

export class XykPolkadotClient extends PolkadotClient implements XykClient {
  async getPoolAssets(): Promise<PoolAsset[]> {
    const poolAssets = await this.api.query.xyk.poolAssets.entries();
    return poolAssets.map((asset: [StorageKey<AnyTuple>, Codec]) => {
      const poolId = this.getStorageKey(asset, 0);
      const poolAssets = this.getStorageEntryArray(asset);
      const poolAssetIn = poolAssets[0].toString();
      const poolAssetOut = poolAssets[1].toString();
      return {
        id: poolId,
        assetIn: poolAssetIn,
        assetOut: poolAssetOut,
      } as PoolAsset;
    });
  }

  getExchangeFee(): number {
    const exchangeFee = this.api.consts.xyk.getExchangeFee;
    return exchangeFee[0].toNumber() / exchangeFee[1].toNumber();
  }

  async getSystemAccountBalance(accountId: string): Promise<string> {
    return await super.getSystemAccountBalance(accountId);
  }

  async getTokenAccountBalance(
    accountId: string,
    tokenKey: string
  ): Promise<string> {
    return await super.getTokenAccountBalance(accountId, tokenKey);
  }
}
