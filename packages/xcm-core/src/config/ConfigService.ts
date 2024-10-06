import { Asset } from '../asset';
import { AnyChain, ChainEcosystem } from '../chain';

import { AssetRoute, ChainRoutes } from './definition';

export interface ConfigServiceOptions {
  assets: Map<string, Asset>;
  chains: Map<string, AnyChain>;
  routes: Map<string, ChainRoutes>;
}

export class ConfigService {
  readonly assets: Map<string, Asset>;

  readonly chains: Map<string, AnyChain>;

  readonly routes: Map<string, ChainRoutes>;

  constructor({ assets, chains, routes }: ConfigServiceOptions) {
    this.assets = new Map(assets);
    this.chains = new Map(chains);
    this.routes = new Map(routes);
  }

  getEcosystemAssets(ecosystem?: ChainEcosystem): Asset[] {
    if (!ecosystem) {
      return Array.from(this.assets.values());
    }

    return Array.from(
      new Set(
        Array.from(this.routes.values())
          .filter((routes) => routes.chain.ecosystem === ecosystem)
          .map((routes) => routes.getRoutes())
          .flat(2)
          .map((route) => route.source.asset)
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

  getChainRoutes(keyOrChain: string | AnyChain): ChainRoutes {
    const key = typeof keyOrChain === 'string' ? keyOrChain : keyOrChain.key;
    const route = this.routes.get(key);

    if (!route) {
      throw new Error(`Chain route for ${key} not found`);
    }
    return route;
  }

  getSourceChains(
    asset: Asset,
    ecosystem: ChainEcosystem | undefined
  ): AnyChain[] {
    return Array.from(this.routes.values())
      .filter((route) => !ecosystem || route.chain.ecosystem === ecosystem)
      .filter((route) => route.getAssetRoutes(asset).length)
      .map((route) => route.chain);
  }

  getDestinationChains(asset: Asset, source: AnyChain): AnyChain[] {
    const routes = this.getChainRoutes(source);
    return routes.getAssetDestinations(asset);
  }

  getAssetRoute(
    asset: Asset,
    source: AnyChain,
    destination: AnyChain
  ): AssetRoute {
    const routes = this.getChainRoutes(source);
    return routes.getAssetRoute(asset, destination);
  }

  updateAsset(asset: Asset): void {
    this.assets.set(asset.key, asset);
  }

  updateChain(chain: AnyChain): void {
    this.chains.set(chain.key, chain);
  }

  updateRoutes(routes: ChainRoutes): void {
    this.routes.set(routes.chain.key, routes);
  }

  updateChainRoute(chain: AnyChain, route: AssetRoute): void {
    const chainRoutes = this.getChainRoutes(chain);
    const routes = chainRoutes.getRoutes();
    const isExisting: (route: AssetRoute) => boolean = ({
      source,
      destination,
    }) =>
      source.asset === route.source.asset &&
      destination.asset === route.destination.asset &&
      destination.chain === route.destination.chain;

    const updatedRoutes: AssetRoute[] = routes
      .filter((route) => !isExisting(route))
      .concat(route);

    const updatedConfig = new ChainRoutes({
      ...chainRoutes,
      routes: updatedRoutes,
    });
    this.routes.set(chainRoutes.chain.key, updatedConfig);
  }
}
