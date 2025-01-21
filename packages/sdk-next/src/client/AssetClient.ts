import { PolkadotClient } from 'polkadot-api';
import { HydrationQueries } from '@polkadot-api/descriptors';

import { SYSTEM_ASSET_ID } from '../consts';
import { Papi } from '../provider';
import { Asset, AssetMetadata, Bond, ExternalAsset } from '../types';

type TStableswapPool = HydrationQueries['Stableswap']['Pools']['Value'];
type TBond = HydrationQueries['Bonds']['Bonds']['Value'];
type TAssetDetails = HydrationQueries['AssetRegistry']['Assets']['Value'];
type TAssetLocation =
  HydrationQueries['AssetRegistry']['AssetLocations']['Value'];

export class AssetClient extends Papi {
  private SUPPORTED_TYPES = [
    'StableSwap',
    'Bond',
    'Token',
    'External',
    'Erc20',
  ];

  constructor(client: PolkadotClient) {
    super(client);
  }

  async queryShares(): Promise<Map<number, TStableswapPool>> {
    const query = this.api.query.Stableswap.Pools;
    const entries = await query.getEntries();
    return new Map(
      entries.map(({ keyArgs, value }) => {
        const [id] = keyArgs;
        return [id, value];
      })
    );
  }

  async queryBonds(): Promise<Map<number, TBond>> {
    const query = this.api.query.Bonds.Bonds;
    const entries = await query.getEntries();
    return new Map(
      entries.map(({ keyArgs, value }) => {
        const [id] = keyArgs;
        return [id, value];
      })
    );
    return new Map([]);
  }

  async queryAssets(): Promise<Map<number, TAssetDetails>> {
    const query = this.api.query.AssetRegistry.Assets;
    const entries = await query.getEntries();
    return new Map(
      entries
        .filter(({ value }) => {
          const { asset_type } = value;
          return this.SUPPORTED_TYPES.includes(asset_type.type);
        })
        .map(({ keyArgs, value }) => {
          const [id] = keyArgs;
          return [id, value];
        })
    );
  }

  async queryAssetLocations(): Promise<Map<number, TAssetLocation>> {
    const query = this.api.query.AssetRegistry.AssetLocations;
    const entries = await query.getEntries();
    return new Map(
      entries.map(({ keyArgs, value }) => {
        const [id] = keyArgs;
        return [id, value];
      })
    );
  }

  private async mapToken(
    key: number,
    details: TAssetDetails,
    metadata: Map<number, AssetMetadata>,
    location?: TAssetLocation
  ): Promise<Asset> {
    if (key === SYSTEM_ASSET_ID) {
      const { name, properties } = await this.client.getChainSpecData();
      const ed = await this.api.constants.Balances.ExistentialDeposit();

      const { tokenDecimals, tokenSymbol } = properties;
      return {
        id: SYSTEM_ASSET_ID,
        name: name,
        symbol: tokenSymbol,
        decimals: tokenDecimals,
        icon: tokenSymbol,
        type: 'Token',
        isSufficient: true,
        existentialDeposit: ed,
      } as Asset;
    }

    const { name, asset_type, is_sufficient, existential_deposit } = details;
    const { symbol, decimals } = metadata.get(key) ?? {};
    return {
      id: key,
      name: name?.asText(),
      symbol: symbol,
      decimals: decimals,
      icon: symbol,
      type: asset_type.type,
      isSufficient: is_sufficient,
      location: location,
      existentialDeposit: existential_deposit,
    } as Asset;
  }

  private async mapBond(
    key: number,
    details: TAssetDetails,
    metadata: Map<number, AssetMetadata>,
    bond: TBond
  ): Promise<Bond> {
    const [underlyingAsset, maturity] = bond;
    const { asset_type, is_sufficient, existential_deposit } = details;
    const { symbol, decimals } = await this.mapToken(
      underlyingAsset,
      details,
      metadata
    );
    const bondMaturity = Number(maturity);
    const bondFormatter = new Intl.DateTimeFormat('en-GB');
    const bondName = [symbol, 'Bond', bondFormatter.format(bondMaturity)].join(
      ' '
    );
    return {
      id: key,
      name: bondName,
      symbol: symbol + 'b',
      decimals: decimals,
      icon: symbol,
      type: asset_type.type,
      isSufficient: is_sufficient,
      existentialDeposit: existential_deposit,
      underlyingAssetId: underlyingAsset.toString(),
      maturity: bondMaturity,
    } as Bond;
  }

  private async mapShares(
    key: number,
    details: TAssetDetails,
    metadata: Map<number, AssetMetadata>,
    share: TStableswapPool
  ): Promise<Asset> {
    const { assets } = share;
    const { name, symbol, asset_type, is_sufficient, existential_deposit } =
      details;

    const poolEntries = await Promise.all(
      assets.map(async (token: number) => {
        const { symbol } = await this.mapToken(token, details, metadata);
        return [token, symbol];
      })
    );

    const meta = Object.fromEntries(poolEntries);
    const symbols = Object.values(meta);
    return {
      id: key,
      name: symbols.join(', '),
      symbol: symbol?.asText() || name?.asText(),
      decimals: 18,
      icon: symbols.join('/'),
      type: asset_type.type,
      isSufficient: is_sufficient,
      existentialDeposit: existential_deposit,
      meta: meta,
    } as Asset;
  }

  private async mapExternal(
    key: number,
    details: TAssetDetails,
    external?: ExternalAsset[],
    location?: TAssetLocation
  ): Promise<Asset> {
    const token = await this.mapToken(key, details, new Map(), location);
    const ext = external?.find((a) => a.internalId === token.id);
    return ext
      ? {
          ...token,
          decimals: ext.decimals,
          name: ext.name,
          symbol: ext.symbol,
          icon: ext.symbol,
          isWhiteListed: ext.isWhiteListed,
        }
      : token;
  }

  private parseMetadata(
    assets: Map<number, TAssetDetails>
  ): Map<number, AssetMetadata> {
    return new Map(
      Array.from(assets, ([key, value]) => [
        key,
        {
          symbol: value.symbol?.asText(),
          decimals: value.decimals,
        } as AssetMetadata,
      ])
    );
  }

  async getOnChainAssets(
    includeInvalid?: boolean,
    external?: ExternalAsset[]
  ): Promise<Asset[]> {
    const [assets, assetLocations, shares, bonds] = await Promise.all([
      this.queryAssets(),
      this.queryAssetLocations(),
      this.queryShares(),
      this.queryBonds(),
    ]);

    const metadata = this.parseMetadata(assets);

    const assetsWithMeta = [];
    for (const [key, value] of Array.from(assets)) {
      const location = assetLocations.get(key);
      const { asset_type } = value;

      let asset;
      switch (asset_type.type) {
        case 'Bond':
          const bond = bonds.get(key);
          asset = await this.mapBond(key, value, metadata, bond!);
          break;
        case 'StableSwap':
          const share = shares.get(key);
          asset = await this.mapShares(key, value, metadata, share!);
          break;
        case 'External':
          asset = await this.mapExternal(key, value, external, location);
          break;
        default:
          asset = await this.mapToken(key, value, metadata, location);
      }
      assetsWithMeta.push(asset);
    }

    return includeInvalid
      ? assetsWithMeta
      : assetsWithMeta.filter((a) => this.isValidAsset(a));
  }

  private isValidAsset(asset: Asset): boolean {
    const decimalSign = Math.sign(asset.decimals);
    return !!asset.symbol && (decimalSign === 0 || decimalSign === 1);
  }
}
