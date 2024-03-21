import type {
  HydradxRuntimeXcmAssetLocation,
  PalletAssetRegistryAssetDetails,
  PalletAssetRegistryAssetMetadata,
  PalletStableswapPoolInfo,
} from '@polkadot/types/lookup';
import { ITuple } from '@polkadot/types-codec/types';
import { u32, u64 } from '@polkadot/types-codec';
import { ApiPromise } from '@polkadot/api';
import { SYSTEM_ASSET_ID } from '../consts';
import { Asset, AssetMetadata, ExternalAsset } from '../types';
import { findNestedKey } from '../utils/json';

import { PolkadotApiClient } from './PolkadotApi';

export class AssetClient extends PolkadotApiClient {
  private SUPPORTED_TYPES = ['StableSwap', 'Bond', 'Token'];

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
        await this.api.query.assetRegistry.assetMetadataMap.entries();
      return new Map(
        entries.map(
          ([
            {
              args: [id],
            },
            value,
          ]) => {
            //@ts-ignore
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

  private getTokens(
    tokenKey: string,
    details: PalletAssetRegistryAssetDetails,
    metadata: Map<string, AssetMetadata>,
    location?: HydradxRuntimeXcmAssetLocation
  ): Asset {
    if (tokenKey == SYSTEM_ASSET_ID) {
      const defaultAssetEd = this.api.consts.balances.existentialDeposit;
      return {
        id: SYSTEM_ASSET_ID,
        name: this.chainToken,
        symbol: this.chainToken,
        decimals: this.chainDecimals,
        icon: this.chainToken,
        type: 'Token',
        existentialDeposit: defaultAssetEd.toString(),
      } as Asset;
    }

    const { name, assetType, existentialDeposit } = details;
    const { symbol, decimals } = metadata.get(tokenKey) ?? {};

    return {
      id: tokenKey,
      name: name.toHuman(),
      symbol: symbol,
      decimals: decimals,
      icon: symbol,
      type: assetType.toHuman(),
      origin: location && this.parseLocation(location, 'parachain'),
      existentialDeposit: existentialDeposit.toString(),
    } as Asset;
  }

  private getBonds(
    tokenKey: string,
    details: PalletAssetRegistryAssetDetails,
    metadata: Map<string, AssetMetadata>,
    bond: ITuple<[u32, u64]>
  ): Asset {
    const [underlyingAsset, maturity] = bond;
    const { assetType, existentialDeposit } = details;
    const { symbol, decimals } = this.getTokens(
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
      existentialDeposit: existentialDeposit.toString(),
    } as Asset;
  }

  private getShares(
    tokenKey: string,
    details: PalletAssetRegistryAssetDetails,
    metadata: Map<string, AssetMetadata>,
    share: PalletStableswapPoolInfo
  ): Asset {
    const { assets } = share;
    const { name, symbol, assetType, existentialDeposit } = details;
    const poolTokens = assets.map((asset) => asset.toString());
    const poolEntries = poolTokens.map((token: string) => {
      const { symbol } = this.getTokens(token, details, metadata);
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
      existentialDeposit: existentialDeposit.toString(),
      meta: meta,
    } as Asset;
  }

  async getOnChainAssets(external?: ExternalAsset[]): Promise<Asset[]> {
    const [asset, assetLocations, shares, bonds, assetMetadata] =
      await Promise.all([
        this.api.query.assetRegistry.assets.entries(),
        this.locationsQuery(),
        this.safeSharesQuery(),
        this.safeBondsQuery(),
        this.metadataQuery(),
      ]);

    const filteredAssets = asset.filter(
      ([
        {
          args: [id],
        },
        state,
      ]) => {
        if (state.isNone) {
          return false;
        }
        const details = state.unwrap();

        if (external && details.assetType.toString() === 'External') {
          const location = assetLocations.get(id.toString());
          const index =
            location && this.parseLocation(location, 'generalIndex');
          const ext = external.find((ext) => ext.id === index?.toString());

          return !!ext;
        }

        return this.isSupportedAsset(details);
      }
    );

    const assetsMeta: Map<string, AssetMetadata> = assetMetadata.size
      ? assetMetadata
      : new Map(
          filteredAssets.map(
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

    return filteredAssets.map(
      ([
        {
          args: [id],
        },
        value,
      ]) => {
        const details: PalletAssetRegistryAssetDetails = value.unwrap();
        const location = assetLocations.get(id.toString());

        const { assetType } = details;
        switch (assetType.toString()) {
          case 'Bond':
            const bond = bonds.get(id.toString());
            return this.getBonds(id.toString(), details, assetsMeta, bond!);
          case 'StableSwap':
            const share = shares.get(id.toString());
            return this.getShares(id.toString(), details, assetsMeta, share!);
          case 'External':
            const ext = external?.find((a) => {
              const index =
                location && this.parseLocation(location, 'generalIndex');

              return a.id === index?.toString();
            });

            const token = this.getTokens(
              id.toString(),
              details,
              new Map(),
              location
            );

            return ext
              ? {
                  ...token,
                  decimals: ext.decimals,
                  name: ext.name,
                  symbol: ext.symbol,
                }
              : token;
          default:
            return this.getTokens(id.toString(), details, assetsMeta, location);
        }
      }
    );
  }

  private isSupportedAsset(details: PalletAssetRegistryAssetDetails): boolean {
    const type = details.assetType.toString();
    const isSupported = this.SUPPORTED_TYPES.includes(type);

    return isSupported;
  }

  private parseLocation(
    location: HydradxRuntimeXcmAssetLocation,
    key: string
  ): number | undefined {
    if (location) {
      const entry = findNestedKey(location.toJSON(), key);
      return entry && entry[key];
    } else {
      return undefined;
    }
  }
}
