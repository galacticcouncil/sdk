import type {
  PalletAssetRegistryAssetDetails,
  PalletAssetRegistryAssetMetadata,
  PalletStableswapPoolInfo,
} from '@polkadot/types/lookup';
import { ApiPromise } from '@polkadot/api';
import { SYSTEM_ASSET_ID } from '../consts';
import { AssetMetadata } from '../types';

import { PolkadotApiClient } from './PolkadotApi';
import { ITuple } from '@polkadot/types-codec/types';
import { u32, u64 } from '@polkadot/types-codec';

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

  async metadataQuery(): Promise<
    Map<string, PalletAssetRegistryAssetMetadata>
  > {
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
            return [id.toString(), value.unwrap()];
          }
        )
      );
    } catch (error) {
      return new Map([]);
    }
  }

  private getTokenMetadata(
    tokenKey: string,
    details: PalletAssetRegistryAssetDetails,
    metadata: Map<string, PalletAssetRegistryAssetMetadata>
  ): AssetMetadata {
    if (tokenKey == SYSTEM_ASSET_ID) {
      const defaultAssetEd = this.api.consts.balances.existentialDeposit;
      return {
        id: SYSTEM_ASSET_ID,
        name: this.chainToken,
        symbol: this.chainToken,
        decimals: this.chainDecimals,
        icon: this.chainToken,
        assetType: 'Token',
        existentialDeposit: defaultAssetEd.toString(),
      } as AssetMetadata;
    }

    const { name, assetType, existentialDeposit } = details;
    const { symbol, decimals } = metadata.get(tokenKey)!;

    return {
      id: tokenKey,
      name: name.toHuman(),
      symbol: symbol.toHuman(),
      decimals: decimals.toNumber(),
      icon: symbol.toHuman(),
      assetType: assetType.toHuman(),
      existentialDeposit: existentialDeposit.toString(),
    } as AssetMetadata;
  }

  private getBondMetadata(
    tokenKey: string,
    details: PalletAssetRegistryAssetDetails,
    metadata: Map<string, PalletAssetRegistryAssetMetadata>,
    bond: ITuple<[u32, u64]>
  ): AssetMetadata {
    const [underlyingAsset, maturity] = bond;
    const { assetType, existentialDeposit } = details;
    const { symbol, decimals } = this.getTokenMetadata(
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
      assetType: assetType.toString(),
      existentialDeposit: existentialDeposit.toString(),
    } as AssetMetadata;
  }

  private getShareMetadata(
    tokenKey: string,
    details: PalletAssetRegistryAssetDetails,
    metadata: Map<string, PalletAssetRegistryAssetMetadata>,
    share: PalletStableswapPoolInfo
  ): AssetMetadata {
    const { assets } = share;
    const { name, assetType, existentialDeposit } = details;
    const poolTokens = assets.map((asset) => asset.toString());
    const poolEntries = poolTokens.map((token: string) => {
      const { symbol } = this.getTokenMetadata(token, details, metadata);
      return [token, symbol];
    });
    const meta = Object.fromEntries(poolEntries);
    const symbols = Object.values(meta);
    return {
      id: tokenKey,
      name: symbols.join(', '),
      symbol: name.length > 0 ? name.toHuman() : tokenKey,
      decimals: 18,
      icon: symbols.join('/'),
      assetType: assetType.toString(),
      existentialDeposit: existentialDeposit.toString(),
      meta: meta,
    } as AssetMetadata;
  }

  async getOnChainMetadata(): Promise<AssetMetadata[]> {
    const [asset, assetMetadata, shares, bonds] = await Promise.all([
      this.api.query.assetRegistry.assets.entries(),
      this.metadataQuery(),
      this.safeSharesQuery(),
      this.safeBondsQuery(),
    ]);

    return asset
      .filter(([_args, state]) => this.isSupportedType(state.unwrap()))
      .map(
        ([
          {
            args: [id],
          },
          value,
        ]) => {
          const details: PalletAssetRegistryAssetDetails = value.unwrap();
          const { assetType } = details;
          switch (assetType.toString()) {
            case 'Bond':
              const bond = bonds.get(id.toString());
              return this.getBondMetadata(
                id.toString(),
                details,
                assetMetadata,
                bond!
              );
            case 'StableSwap':
              const share = shares.get(id.toString());
              return this.getShareMetadata(
                id.toString(),
                details,
                assetMetadata,
                share!
              );
            default:
              return this.getTokenMetadata(
                id.toString(),
                details,
                assetMetadata
              );
          }
        }
      );
  }

  private isSupportedType(details: PalletAssetRegistryAssetDetails) {
    return this.SUPPORTED_TYPES.includes(details.assetType.toString());
  }
}
