import { Chain, ChainAsset } from './types';
import { readJsonOrReturnEmptyObject } from './utils';

export class Registry {
  private chains: Chain[] = [];
  private assets: Record<number, ChainAsset[]> = {};

  constructor(relay: string) {
    this.initChains(relay);
    this.initAssets(relay);
  }

  private initChains(relay: string) {
    const json = readJsonOrReturnEmptyObject(`./registry/${relay}/endpoints.json`);
    Object.keys(json).forEach((chainKey: string) => {
      const chain = json[chainKey];
      this.chains.push(chain);
    });
  }

  private initAssets(relay: string) {
    this.chains.forEach((chain: Chain) => {
      const json = readJsonOrReturnEmptyObject(`./registry/${relay}/assets/${relay}_${chain.paraID}_assets.json`);
      const assets: ChainAsset[] = [];
      Object.assign(assets, json);
      this.assets[chain.paraID] = assets;
    });
  }

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
