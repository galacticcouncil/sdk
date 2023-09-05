import { ApiPromise } from '@polkadot/api';
import { SYSTEM_ASSET_ID } from '../consts';
import { AssetDetail, AssetMetadata } from '../types';

import { PolkadotApiClient } from './PolkadotApi';

export class AssetClient extends PolkadotApiClient {
  constructor(api: ApiPromise) {
    super(api);
  }

  async getAssetMetadata(tokenKey: string): Promise<AssetMetadata> {
    try {
      const bond = await this.api.query.bonds.bonds(tokenKey);
      if (bond.isSome) {
        const [underlyingAsset] = bond.unwrap();
        const underlyingTokenKey = underlyingAsset.toString();
        return this.getBondMetadata(underlyingTokenKey);
      }
      return this.getTokenMetadata(tokenKey);
    } catch {
      return this.getTokenMetadata(tokenKey);
    }
  }

  private async getTokenMetadata(tokenKey: string): Promise<AssetMetadata> {
    if (tokenKey == SYSTEM_ASSET_ID) {
      return {
        symbol: this.chainToken,
        origin: this.chainToken,
        decimals: this.chainDecimals,
      } as AssetMetadata;
    }

    const metadata = await this.api.query.assetRegistry.assetMetadataMap(tokenKey);
    const { symbol, decimals } = metadata.unwrap();
    return {
      symbol: symbol.toHuman(),
      origin: symbol.toHuman(),
      decimals: decimals.toNumber(),
    } as AssetMetadata;
  }

  private async getBondMetadata(underlyingTokenKey: string): Promise<AssetMetadata> {
    const { symbol, decimals } = await this.getTokenMetadata(underlyingTokenKey);
    return {
      symbol: symbol + 'b',
      origin: symbol,
      decimals: decimals,
    } as AssetMetadata;
  }

  async getAssetDetail(tokenKey: string): Promise<AssetDetail> {
    try {
      const bond = await this.api.query.bonds.bonds(tokenKey);
      if (bond.isSome) {
        const [underlyingAsset, maturity] = bond.unwrap();
        const underlyingTokenKey = underlyingAsset.toString();
        const maturityTimestamp = maturity.toNumber();
        return this.getBondDetail(tokenKey, underlyingTokenKey, maturityTimestamp);
      }
      return this.getTokenDetail(tokenKey);
    } catch {
      return this.getTokenDetail(tokenKey);
    }
  }

  private async getTokenDetail(tokenKey: string): Promise<AssetDetail> {
    if (tokenKey == SYSTEM_ASSET_ID) {
      const defaultAssetEd = this.api.consts.balances.existentialDeposit;
      return {
        name: this.chainToken,
        assetType: 'Token',
        existentialDeposit: defaultAssetEd.toString(),
      } as AssetDetail;
    }

    const asset = await this.api.query.assetRegistry.assets(tokenKey);
    const { name, assetType, existentialDeposit } = asset.unwrap();
    return {
      name: name.toHuman(),
      assetType: assetType.toHuman(),
      existentialDeposit: existentialDeposit.toString(),
    } as AssetDetail;
  }

  private async getBondDetail(tokenKey: string, underlyingTokenKey: string, maturity: number): Promise<AssetDetail> {
    const { assetType, existentialDeposit } = await this.getTokenDetail(tokenKey);
    const { origin } = await this.getBondMetadata(underlyingTokenKey);

    const bondMaturity = new Intl.DateTimeFormat('en-GB');
    const bondName = [origin, 'Bond', bondMaturity.format(maturity)].join(' ');

    return {
      name: bondName,
      assetType: assetType,
      existentialDeposit: existentialDeposit,
    } as AssetDetail;
  }
}
