import type {
  HydradxRuntimeXcmAssetLocation,
  PalletAssetRegistryAssetDetails,
  PalletAssetRegistryAssetMetadata,
  PalletStableswapPoolInfo,
} from '@polkadot/types/lookup';
import { ITuple } from '@polkadot/types-codec/types';
import { u32, u64 } from '@polkadot/types-codec';
import { Option, StorageKey } from '@polkadot/types';
import { ApiPromise } from '@polkadot/api';
import { SYSTEM_ASSET_ID } from '../consts';
import { Asset, AssetMetadata, Bond, ExternalAsset } from '../types';
import { findNestedKey } from '../utils/json';

import { PolkadotApiClient } from './PolkadotApi';

export class AssetClient extends PolkadotApiClient {
  private SUPPORTED_TYPES = ['StableSwap', 'Bond', 'Token', 'External'];

  constructor(api: ApiPromise) {
    super(api);
  }

  async safeSharesQuery(): Promise<Map<string, PalletStableswapPoolInfo>> {
    try {
      const entries = await this.api.query.stableswap.pools.entries();
      return new Map(
        entries.map(
          ([
            {
              args: [id],
            },
            value,
          ]) => [id.toString(), value.unwrap()]
        )
      );
    } catch (error) {
      return new Map([]);
    }
  }

  async safeBondsQuery(): Promise<Map<string, ITuple<[u32, u64]>>> {
    try {
      const entries = await this.api.query.bonds.bonds.entries();
      return new Map(
        entries.map(
          ([
            {
              args: [id],
            },
            value,
          ]) => {
            return [id.toString(), value.unwrap()];
          }
        )
      );
    } catch (error) {
      return new Map([]);
    }
  }

  async metadataQuery(): Promise<Map<string, AssetMetadata>> {
    try {
      const entries =
        await this.api.query.assetRegistry.assetMetadataMap.entries<
          Option<PalletAssetRegistryAssetMetadata>
        >();
      return new Map(
        entries.map(
          ([
            {
              args: [id],
            },
            value,
          ]) => {
            const { decimals, symbol } = value.unwrap();
            return [
              id.toString(),
              {
                decimals: decimals.toNumber(),
                symbol: symbol.toHuman() as string,
              },
            ];
          }
        )
      );
    } catch (error) {
      return new Map([]);
    }
  }

  async locationsQuery(): Promise<Map<string, HydradxRuntimeXcmAssetLocation>> {
    try {
      const entries =
        await this.api.query.assetRegistry.assetLocations.entries();
      return new Map(
        entries.map(
          ([
            {
              args: [id],
            },
            value,
          ]) => {
            return [id.toString(), value.unwrap()];
          }
        )
      );
    } catch (error) {
      return new Map([]);
    }
  }

  private getSystemTokenName(chainToken: string) {
    switch (chainToken) {
      case 'HDX':
        return 'Hydration';
      case 'BSX':
        return 'Basilisk';
      default:
        return chainToken;
    }
  }

  private getToken(
    tokenKey: string,
    details: PalletAssetRegistryAssetDetails,
    metadata: Map<string, AssetMetadata>,
    location?: HydradxRuntimeXcmAssetLocation
  ): Asset {
    if (tokenKey == SYSTEM_ASSET_ID) {
      const defaultAssetEd = this.api.consts.balances.existentialDeposit;
      return {
        id: SYSTEM_ASSET_ID,
        name: this.getSystemTokenName(this.chainToken),
        symbol: this.chainToken,
        decimals: this.chainDecimals,
        icon: this.chainToken,
        type: 'Token',
        isSufficient: true,
        existentialDeposit: defaultAssetEd.toString(),
      } as Asset;
    }

    const { name, assetType, isSufficient, existentialDeposit } = details;
    const { symbol, decimals } = metadata.get(tokenKey) ?? {};
    const origin = this.parseLocation('parachain', location);
    const pendulumId = 2094;
    return {
      id: tokenKey,
      name: name.toHuman(),
      symbol: symbol,
      decimals: decimals,
      icon: symbol,
      type: assetType.toHuman(),
      isSufficient: isSufficient ? isSufficient.toHuman() : true,
      origin,
      externalId: this.parseLocation(
        pendulumId === origin ? 'generalKey' : 'generalIndex',
        location
      ),
      existentialDeposit: existentialDeposit.toString(),
    } as Asset;
  }

  private getBond(
    tokenKey: string,
    details: PalletAssetRegistryAssetDetails,
    metadata: Map<string, AssetMetadata>,
    bond: ITuple<[u32, u64]>
  ): Bond {
    const [underlyingAsset, maturity] = bond;
    const { assetType, isSufficient, existentialDeposit } = details;
    const { symbol, decimals } = this.getToken(
      underlyingAsset.toString(),
      details,
      metadata
    );
    const bondMaturity = maturity.toNumber();
    const bondFormatter = new Intl.DateTimeFormat('en-GB');
    const bondName = [symbol, 'Bond', bondFormatter.format(bondMaturity)].join(
      ' '
    );
    return {
      id: tokenKey,
      name: bondName,
      symbol: symbol + 'b',
      decimals: decimals,
      icon: symbol,
      type: assetType.toString(),
      isSufficient: isSufficient.toHuman(),
      existentialDeposit: existentialDeposit.toString(),
      underlyingAssetId: underlyingAsset.toString(),
      maturity: bondMaturity,
    } as Bond;
  }

  private getShares(
    tokenKey: string,
    details: PalletAssetRegistryAssetDetails,
    metadata: Map<string, AssetMetadata>,
    share: PalletStableswapPoolInfo
  ): Asset {
    const { assets } = share;
    const { name, symbol, assetType, isSufficient, existentialDeposit } =
      details;
    const poolTokens = assets.map((asset) => asset.toString());
    const poolEntries = poolTokens.map((token: string) => {
      const { symbol } = this.getToken(token, details, metadata);
      return [token, symbol];
    });
    const meta = Object.fromEntries(poolEntries);
    const symbols = Object.values(meta);
    return {
      id: tokenKey,
      name: symbols.join(', '),
      symbol: symbol?.isSome ? symbol.toHuman() : name.toHuman(),
      decimals: 18,
      icon: symbols.join('/'),
      type: assetType.toString(),
      isSufficient: isSufficient.toHuman(),
      existentialDeposit: existentialDeposit.toString(),
      meta: meta,
    } as Asset;
  }

  private getExternal(
    tokenKey: string,
    details: PalletAssetRegistryAssetDetails,
    external?: ExternalAsset[],
    location?: HydradxRuntimeXcmAssetLocation
  ): Asset {
    const token = this.getToken(tokenKey, details, new Map(), location);
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

  private normalizeMetadata(
    assets: [StorageKey<[u32]>, Option<PalletAssetRegistryAssetDetails>][],
    metadata: Map<string, AssetMetadata>
  ): Map<string, AssetMetadata> {
    return metadata.size
      ? metadata
      : new Map(
          assets.map(
            ([
              {
                args: [id],
              },
              value,
            ]) => {
              const { decimals, symbol } = value.unwrap();
              return [
                id.toString(),
                {
                  decimals: Number(decimals.toString()),
                  symbol: symbol.toHuman() as string,
                },
              ];
            }
          )
        );
  }

  private getSupportedAssets(
    assets: [StorageKey<[u32]>, Option<PalletAssetRegistryAssetDetails>][]
  ) {
    return assets.filter(([_args, state]) => {
      if (state.isNone) {
        return false;
      }
      const details = state.unwrap();
      return this.isSupportedAsset(details);
    });
  }

  async getOnChainAssets(
    includeInvalid?: boolean,
    external?: ExternalAsset[]
  ): Promise<Asset[]> {
    const [assets, assetLocations, shares, bonds, legacyMetadata] =
      await Promise.all([
        this.api.query.assetRegistry.assets.entries(),
        this.locationsQuery(),
        this.safeSharesQuery(),
        this.safeBondsQuery(),
        this.metadataQuery(),
      ]);

    const supportedAssets = this.getSupportedAssets(assets);
    const metadata = this.normalizeMetadata(supportedAssets, legacyMetadata);

    const assetsWithMeta = supportedAssets.map(
      ([
        {
          args: [id],
        },
        value,
      ]) => {
        const details = value.unwrap();
        const location = assetLocations.get(id.toString());

        const { assetType } = details;
        switch (assetType.toString()) {
          case 'Bond':
            const bond = bonds.get(id.toString());
            return this.getBond(id.toString(), details, metadata, bond!);
          case 'StableSwap':
            const share = shares.get(id.toString());
            return this.getShares(id.toString(), details, metadata, share!);
          case 'External':
            return this.getExternal(id.toString(), details, external, location);
          default:
            return this.getToken(id.toString(), details, metadata, location);
        }
      }
    );

    return includeInvalid
      ? assetsWithMeta
      : assetsWithMeta.filter((a) => this.isValidAsset(a));
  }

  private isValidAsset(asset: Asset): boolean {
    return !!asset.symbol && !!asset.decimals;
  }

  private isSupportedAsset(details: PalletAssetRegistryAssetDetails): boolean {
    const type = details.assetType.toString();
    return this.SUPPORTED_TYPES.includes(type);
  }

  private parseLocation(
    key: string,
    location?: HydradxRuntimeXcmAssetLocation
  ): any | undefined {
    if (location) {
      const entry = findNestedKey(location.toJSON(), key);
      return entry && entry[key];
    } else {
      return undefined;
    }
  }
}
