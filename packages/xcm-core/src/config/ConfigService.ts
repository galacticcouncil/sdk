import { Asset } from '../asset';
import { AnyChain, ChainEcosystem } from '../chain';

import { AssetConfig, ChainConfig } from './definition';

export interface ConfigServiceOptions {
  assets: Map<string, Asset>;
  chains: Map<string, AnyChain>;
  chainsConfig: Map<string, ChainConfig>;
}

export class ConfigService {
  readonly assets: Map<string, Asset>;

  readonly chains: Map<string, AnyChain>;

  readonly chainsConfig: Map<string, ChainConfig>;

  constructor({ assets, chains, chainsConfig }: ConfigServiceOptions) {
    this.assets = assets;
    this.chains = chains;
    this.chainsConfig = chainsConfig;
  }

  getEcosystemAssets(ecosystem?: ChainEcosystem): Asset[] {
    if (!ecosystem) {
      return Array.from(this.assets.values());
    }

    return Array.from(
      new Set(
        Array.from(this.chainsConfig.values())
          .filter((chainConfig) => chainConfig.chain.ecosystem === ecosystem)
          .map((chainConfig) => chainConfig.getAssetsConfigs())
          .flat(2)
          .map((assetConfig) => assetConfig.asset)
      )
    ).sort((a, b) => a.key.localeCompare(b.key));
  }

  getAsset(keyOrAsset: string | Asset): Asset {
    const key = typeof keyOrAsset === 'string' ? keyOrAsset : keyOrAsset.key;
    const asset = this.assets.get(key);

    if (!asset) {
      throw new Error(`Asset ${key} not found`);
    }
    return asset;
  }

  getChain(keyOrChain: string | AnyChain): AnyChain {
    const key = typeof keyOrChain === 'string' ? keyOrChain : keyOrChain.key;
    const chain = this.chains.get(key);

    if (!chain) {
      throw new Error(`Chain ${key} not found`);
    }
    return chain;
  }

  getChainConfig(keyOrChain: string | AnyChain): ChainConfig {
    const key = typeof keyOrChain === 'string' ? keyOrChain : keyOrChain.key;
    const chainConfig = this.chainsConfig.get(key);

    if (!chainConfig) {
      throw new Error(`Chain config for ${key} not found`);
    }
    return chainConfig;
  }

  getSourceChains(
    asset: Asset,
    ecosystem: ChainEcosystem | undefined
  ): AnyChain[] {
    return Array.from(this.chainsConfig.values())
      .filter((chainConfig) => chainConfig.getAssetConfigs(asset).length)
      .filter(
        (chainConfig) => !ecosystem || chainConfig.chain.ecosystem === ecosystem
      )
      .map((chainConfig) => chainConfig.chain);
  }

  getDestinationChains(asset: Asset, source: AnyChain): AnyChain[] {
    const chainConfig = this.chainsConfig.get(source.key);

    if (!chainConfig) {
      throw new Error(`Config for chain ${source.key} not found`);
    }
    return chainConfig.getAssetDestinations(asset);
  }

  getAssetDestinationConfig(
    asset: Asset,
    source: AnyChain,
    destination: AnyChain
  ): AssetConfig {
    const chainConfig = this.chainsConfig.get(source.key);

    if (!chainConfig) {
      throw new Error(`Config for chain ${source.key} not found`);
    }
    return chainConfig.getAssetDestinationConfig(asset, destination);
  }

  updateAsset(asset: Asset): void {
    this.assets.set(asset.key, asset);
  }

  updateChain(chain: AnyChain): void {
    this.chains.set(chain.key, chain);
  }

  updateChainConfig(chainConfig: ChainConfig): void {
    this.chainsConfig.set(chainConfig.chain.key, chainConfig);
  }
}
