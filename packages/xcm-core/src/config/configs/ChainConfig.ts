import { AnyChain, Asset } from '@moonbeam-network/xcm-types';

import { AssetConfig } from './AssetConfig';

const supportedBridges = ['_awh', '_mwh'];

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

  getAssetDestinationConfig(asset: Asset, destination: AnyChain): AssetConfig {
    let assetConfig = this.assets.get(`${asset.key}-${destination.key}`);

    // If assetConfig not found & token is bridged, try lookup other variants
    if (!assetConfig && this.isBridged(asset)) {
      const vars = this.getBridgedVariants(asset);
      assetConfig = vars
        .map((v) => this.assets.get(`${v}-${destination.key}`))
        .find((c) => !!c);
    }

    if (!assetConfig) {
      throw new Error(
        `AssetConfig for ${asset.key} and destination ${destination.key} not found`
      );
    }
    return assetConfig;
  }

  /**
   * Check if asset is bridged
   *
   * @param asset - transfer asset
   */
  private isBridged(asset: Asset) {
    const bridge = supportedBridges.find((b) => asset.key.includes(b));
    return !!bridge;
  }

  /**
   * Return all variants of asset, bridged inclusive
   *
   * @param asset - transfer asset
   */
  private getBridgedVariants(asset: Asset): string[] {
    const origin = asset.key.split('_')[0];
    return supportedBridges.map((b) => origin + b).concat(origin);
  }
}
