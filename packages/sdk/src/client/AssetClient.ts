import { ApiPromise } from '@polkadot/api';
import { SYSTEM_ASSET_ID } from '../consts';
import { AssetDetail, AssetMetadata } from '../types';

import { PolkadotApiClient } from './PolkadotApi';

export class AssetClient extends PolkadotApiClient {
  constructor(api: ApiPromise) {
    super(api);
  }

  private async tryBonds<T>(
    tokenKey: string,
    cb: (tokenKey: string, underlyingAsset: string, maturity: number) => Promise<T>
  ) {
    try {
      const bond = await this.api.query.bonds.bonds(tokenKey);
      if (bond.isSome) {
        const [underlyingAsset, maturity] = bond.unwrap();
        const underlyingTokenKey = underlyingAsset.toString();
        const maturityTimestamp = maturity.toNumber();
        return cb(tokenKey, underlyingTokenKey, maturityTimestamp);
      }
    } catch {}
    return undefined;
  }

  private async tryShares<T>(tokenKey: string, cb: (tokenKey: string, tokens: string[]) => Promise<T>) {
    try {
      const share = await this.api.query.stableswap.pools(tokenKey);
      if (share.isSome) {
        const { assets } = share.unwrap();
        const poolTokens = assets.map((asset) => asset.toString());
        return cb(tokenKey, poolTokens);
      }
    } catch {}
    return undefined;
  }

  private async getTokenMetadata(tokenKey: string): Promise<AssetMetadata> {
    if (tokenKey == SYSTEM_ASSET_ID) {
      return {
        symbol: this.chainToken,
        decimals: this.chainDecimals,
        icon: this.chainToken,
      } as AssetMetadata;
    }

    const metadata = await this.api.query.assetRegistry.assetMetadataMap(tokenKey);
    const { symbol, decimals } = metadata.unwrap();
    return {
      symbol: symbol.toHuman(),
      decimals: decimals.toNumber(),
      icon: symbol.toHuman(),
    } as AssetMetadata;
  }

  private async getBondMetadata(_tokenKey: string, underlyingTokenKey: string): Promise<AssetMetadata> {
    const { symbol, decimals } = await this.getTokenMetadata(underlyingTokenKey);
    return {
      symbol: symbol + 'b',
      decimals: decimals,
      icon: symbol,
    } as AssetMetadata;
  }

  private async getShareMetadata(tokenKey: string, tokens: string[]): Promise<AssetMetadata> {
    const meta: [string, AssetMetadata][] = await Promise.all(
      tokens.map(async (token: string) => [token, await this.getTokenMetadata(token)])
    );
    const icons = meta.reduce((acc, item) => ({ ...acc, [item[1].symbol]: item[0] }), {});
    const { name } = await this.getTokenDetail(tokenKey);
    return {
      symbol: name,
      decimals: 18,
      icon: Object.keys(icons).join('/'),
      meta: icons,
    } as AssetMetadata;
  }

  async getAssetMetadata(tokenKey: string): Promise<AssetMetadata> {
    const maybe = await Promise.all([
      this.tryBonds(tokenKey, this.getBondMetadata.bind(this)),
      this.tryShares(tokenKey, this.getShareMetadata.bind(this)),
    ]);
    return maybe.find((e) => e!!) || this.getTokenMetadata(tokenKey);
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
    const { icon } = await this.getBondMetadata(tokenKey, underlyingTokenKey);

    const bondMaturity = new Intl.DateTimeFormat('en-GB');
    const bondName = [icon, 'Bond', bondMaturity.format(maturity)].join(' ');

    return {
      name: bondName,
      assetType: assetType,
      existentialDeposit: existentialDeposit,
    } as AssetDetail;
  }

  private async getShareDetail(tokenKey: string, tokens: string[]): Promise<AssetDetail> {
    const { assetType, existentialDeposit } = await this.getTokenDetail(tokenKey);
    const metadata = await Promise.all(tokens.map(async (token: string) => this.getTokenMetadata(token)));
    const symbols = metadata.map((m) => m.symbol);
    const shareName = symbols.join(',');

    return {
      name: shareName,
      assetType: assetType,
      existentialDeposit: existentialDeposit,
    } as AssetDetail;
  }

  async getAssetDetail(tokenKey: string): Promise<AssetDetail> {
    const maybe = await Promise.all([
      this.tryBonds(tokenKey, this.getBondDetail.bind(this)),
      this.tryShares(tokenKey, this.getShareDetail.bind(this)),
    ]);
    return maybe.find((e) => e!!) || this.getTokenDetail(tokenKey);
  }
}
