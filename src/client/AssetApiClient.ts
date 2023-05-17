import type { Enum, Bytes, Option, Struct, u8, u32, u128, bool } from '@polkadot/types-codec';
import type { ITuple } from '@polkadot/types-codec/types';
import { ApiPromise } from '@polkadot/api';
import { SYSTEM_ASSET_ID } from '../consts';
import { AssetDetail, AssetMetadata } from '../types';

import { PolkadotApiClient } from './PolkadotApi';

interface PalletAssetRegistryAssetMetadata extends Struct {
  readonly symbol: Bytes;
  readonly decimals: u8;
}

interface PalletAssetRegistryAssetDetails extends Struct {
  readonly name: Bytes;
  readonly assetType: PalletAssetRegistryAssetType;
  readonly existentialDeposit: u128;
  readonly locked: bool;
}

interface PalletAssetRegistryAssetType extends Enum {
  readonly isToken: boolean;
  readonly isPoolShare: boolean;
  readonly asPoolShare: ITuple<[u32, u32]>;
  readonly type: 'Token' | 'PoolShare';
}

export class AssetApiClient extends PolkadotApiClient {
  constructor(api: ApiPromise) {
    super(api);
  }

  async getAssetMetadata(tokenKey: string): Promise<AssetMetadata> {
    const metadata = await this.api.query.assetRegistry.assetMetadataMap<Option<PalletAssetRegistryAssetMetadata>>(
      tokenKey
    );
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
        existentialDeposit: defaultAssetEd.toString(),
        locked: false,
      } as AssetDetail;
    }

    const asset = await this.api.query.assetRegistry.assets<Option<PalletAssetRegistryAssetDetails>>(tokenKey);
    const unwrapped = asset.unwrap();
    return {
      name: unwrapped.name.toHuman(),
      existentialDeposit: unwrapped.existentialDeposit.toString(),
      locked: unwrapped.locked.isTrue,
    } as AssetDetail;
  }
}
