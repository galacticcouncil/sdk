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
      routes.map(
        ({
          source,
          destination,
          contract,
          extrinsic,
          move,
          program,
          transact,
          tags,
        }) => [
          `${source.asset.key}-${destination.chain.key}-${destination.asset.key}`,
          new AssetRoute({
            source,
            destination,
            contract,
            extrinsic,
            move,
            program,
            transact,
            tags,
          }),
        ]
      )
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

  getAssetDestinationRoutes(asset: Asset, destination: AnyChain): AssetRoute[] {
    const routes = Array.from(this.routes.values()).filter(
      (r) => r.source.asset === asset && r.destination.chain === destination
    );
    if (routes.length === 0) {
      throw new Error(
        `AssetRoute for asset ${asset.key} and destination ${destination.key} not found`
      );
    }
    return routes;
  }
}
