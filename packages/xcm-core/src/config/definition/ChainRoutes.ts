import { Asset } from '../../asset';
import { AnyChain } from '../../chain';

import { AssetRoute } from './AssetRoute';

export interface ChainRoutesParams {
  chain: AnyChain;
  routes: AssetRoute[];
}

export class ChainRoutes {
  readonly routes: Map<string, AssetRoute> = new Map();

  readonly chain: AnyChain;

  constructor({ chain, routes }: ChainRoutesParams) {
    this.chain = chain;
    this.routes = new Map(
      routes.map(({ source, destination, contract, extrinsic, via }) => [
        `${source.asset.key}-${destination.chain.key}`,
        new AssetRoute({
          source,
          destination,
          contract,
          extrinsic,
          via,
        }),
      ])
    );
  }

  getRoutes(): AssetRoute[] {
    return Array.from(this.routes.values());
  }

  getUniqueRoutes(): AssetRoute[] {
    const routes = this.getRoutes();
    return [
      ...new Map(routes.map((route) => [route.source.asset, route])).values(),
    ];
  }

  getAssetRoutes(asset: Asset): AssetRoute[] {
    return this.getRoutes().filter(
      (route) => route.source.asset.key === asset.key
    );
  }

  getAssetDestinations(asset: Asset): AnyChain[] {
    return this.getAssetRoutes(asset).map((route) => route.destination.chain);
  }

  getAssetRoute(asset: Asset, destination: AnyChain): AssetRoute {
    const route = this.routes.get(`${asset.key}-${destination.key}`);
    if (!route) {
      throw new Error(
        `AssetRoute for asset ${asset.key} and destination ${destination.key} not found`
      );
    }
    return route;
  }
}
