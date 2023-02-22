import { Chain, ChainAsset } from './types';
import polkadotEndpoints from './data/polkadot/endpoints.json';
import polkadotAssets from './data/polkadot/assets.json';
import kusamaEndpoints from './data/kusama/endpoints.json';
import kusamaAssets from './data/kusama/assets.json';

abstract class Registry {
  protected chains: Chain[] = [];
  protected assets: Record<number, ChainAsset[]> = {};

  constructor() {
    this.initChains();
    this.initAssets();
  }

  protected abstract initChains(): void;
  protected abstract initAssets(): void;

  getChains(): Chain[] {
    return this.chains;
  }

  getChain(chainId: number): Chain {
    return this.chains.filter((chain: Chain) => chain.paraID == chainId)[0];
  }

  getAssets(chainId: number): ChainAsset[] {
    return this.assets[chainId];
  }
}

export class PolkadotRegistry extends Registry {
  protected initChains(): void {
    Object.keys(polkadotEndpoints).forEach((chainKey: string) => {
      const chain = polkadotEndpoints[chainKey];
      this.chains.push(chain);
    });
  }
  protected initAssets(): void {
    this.chains.forEach((chain: Chain) => {
      const assets: ChainAsset[] = polkadotAssets[chain.paraID];
      this.assets[chain.paraID] = assets;
    });
  }
}

export class KusamaRegistry extends Registry {
  protected initChains(): void {
    Object.keys(kusamaEndpoints).forEach((chainKey: string) => {
      const chain = kusamaEndpoints[chainKey];
      this.chains.push(chain);
    });
  }
  protected initAssets(): void {
    this.chains.forEach((chain: Chain) => {
      const assets: ChainAsset[] = kusamaAssets[chain.paraID];
      this.assets[chain.paraID] = assets;
    });
  }
}
