import { ApiPromise } from '@polkadot/api';
import { SYSTEM_ASSET_ID } from '../consts';
import { AssetDetail, AssetMetadata } from '../types';

import { PolkadotApiClient } from './PolkadotApi';

export class AssetClient extends PolkadotApiClient {
  constructor(api: ApiPromise) {
    super(api);
  }

  async getAssetMetadata(tokenKey: string): Promise<AssetMetadata> {
    const metadata = await this.api.query.assetRegistry.assetMetadataMap(tokenKey);
    if (metadata.isNone) {
      return {
        symbol: this.chainToken,
        decimals: this.chainDecimals,
      } as AssetMetadata;
    }

    const unwrapped = metadata.unwrap();
    return {
      symbol: unwrapped.symbol.toHuman(),
      decimals: unwrapped.decimals.toNumber(),
    } as AssetMetadata;
  }

  async getAssetDetail(tokenKey: string): Promise<AssetDetail> {
    if (tokenKey == SYSTEM_ASSET_ID) {
      const defaultAssetEd = this.api.consts.balances.existentialDeposit;
      return {
        name: this.chainToken,
        assetType: 'Token',
        existentialDeposit: defaultAssetEd.toString(),
      } as AssetDetail;
    }

    const asset = await this.api.query.assetRegistry.assets(tokenKey);
    const unwrapped = asset.unwrap();
    return {
      name: unwrapped.name.toHuman(),
      assetType: unwrapped.assetType.toHuman(),
      existentialDeposit: unwrapped.existentialDeposit.toString(),
    } as AssetDetail;
  }
}
