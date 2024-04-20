import { AnyChain, Asset } from '@moonbeam-network/xcm-types';

import { AssetConfig } from './AssetConfig';

export interface ChainConfigParams {
  assets: AssetConfig[];
  chain: AnyChain;
}

export class ChainConfig {
  readonly assets: Map<string, AssetConfig> = new Map();

  readonly chain: AnyChain;

  constructor({ assets, chain }: ChainConfigParams) {
    this.chain = chain;
    this.assets = new Map(
      assets.map((asset) => [
        `${asset.asset.key}-${asset.destination.key}`,
        asset,
      ])
    );
  }

  getAssetsConfigs(): AssetConfig[] {
    return Array.from(this.assets.values());
  }

  getUniqueAssetsConfigs(): AssetConfig[] {
    const configs = this.getAssetsConfigs();
    return [...new Map(configs.map((cfg) => [cfg.asset, cfg])).values()];
  }

  getAssetConfigs(asset: Asset): AssetConfig[] {
    return this.getAssetsConfigs().filter(
      (assetConfig) => assetConfig.asset.key === asset.key
    );
  }

  getAssetDestinations(asset: Asset): AnyChain[] {
    return this.getAssetConfigs(asset).map(
      (assetConfig) => assetConfig.destination
    );
  }

  getAssetDestinationConfig(
    asset: Asset,
    source: AnyChain,
    destination: AnyChain
  ): AssetConfig {
    const assetKey = this.normalizeKey(asset, source, destination);
    const assetConfig = this.assets.get(`${assetKey}-${destination.key}`);
    if (!assetConfig) {
      throw new Error(
        `AssetConfig for ${assetKey} and destination ${destination.key} not found`
      );
    }
    return assetConfig;
  }

  /**
   * Normalize key of wrapped assets (via Wormhole)
   *
   * @param asset - transfer asset
   * @param source - source chain
   * @param destination - destination chain
   * @returns corresponding source chain key of wrapped asset or default
   */
  private normalizeKey(asset: Asset, source: AnyChain, destination: AnyChain) {
    if (
      source.key === 'moonbeam' &&
      destination.key === 'acala' &&
      asset.key.includes('_awh')
    ) {
      return asset.key.replace('_awh', '_mwh');
    } else if (
      source.key === 'acala' &&
      destination.key === 'moonbeam' &&
      asset.key.includes('_mwh')
    ) {
      return asset.key.replace('_mwh', '_awh');
    } else {
      return asset.key;
    }
  }
}
