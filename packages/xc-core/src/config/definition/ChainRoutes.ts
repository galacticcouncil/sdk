import { Asset } from '../../asset';
import { AnyChain } from '../../chain';

import { AssetRoute } from './AssetRoute';

export interface ChainRoutesParams {
  chain: AnyChain;
  routes: AssetRoute[];
}

export class ChainRoutes {
  readonly routes: Map<string, AssetRoute[]> = new Map();

  readonly chain: AnyChain;

  constructor({ chain, routes }: ChainRoutesParams) {
    this.chain = chain;
    const grouped = new Map<string, AssetRoute[]>();
    for (const route of routes) {
      const key = `${route.source.asset.key}-${route.destination.chain.key}-${route.destination.asset.key}`;
      const existing = grouped.get(key) ?? [];
      existing.push(
        new AssetRoute({
          source: route.source,
          destination: route.destination,
          contract: route.contract,
          extrinsic: route.extrinsic,
          move: route.move,
          program: route.program,
          transact: route.transact,
          tags: route.tags,
        })
      );
      grouped.set(key, existing);
    }
    this.routes = grouped;
  }

  getRoutes(): AssetRoute[] {
    return Array.from(this.routes.values()).flat();
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
    const chains = this.getAssetRoutes(asset).map(
      (route) => route.destination.chain
    );
    return [...new Set(chains)];
  }

  getAssetDestinationRoutes(asset: Asset, destination: AnyChain): AssetRoute[] {
    const routes = this.getAssetDestinationRoutesOrEmpty(asset, destination);
    if (routes.length === 0) {
      throw new Error(
        `AssetRoute for asset ${asset.key} and destination ${destination.key} not found`
      );
    }
    return routes;
  }

  /**
   * Like {@link getAssetDestinationRoutes} but returns an empty array instead
   * of throwing when no route exists — used to probe for a reverse route
   * without relying on exceptions for control flow.
   */
  getAssetDestinationRoutesOrEmpty(
    asset: Asset,
    destination: AnyChain
  ): AssetRoute[] {
    return this.getRoutes().filter(
      (r) => r.source.asset === asset && r.destination.chain === destination
    );
  }
}
