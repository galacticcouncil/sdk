import { Edge, RouteSuggester, RouteProposal } from './route';

import {
  hashPools,
  Hop,
  IPoolService,
  Pool,
  PoolBase,
  PoolFactory,
  PoolType,
} from '../pool';
import { Asset } from '../types';

export type RouterOptions = {
  includeOnly?: PoolType[];
};

export class Router {
  private readonly routeSuggester: RouteSuggester;
  private readonly routeProposals: Map<string, RouteProposal[]>;
  private readonly routerOptions: RouterOptions;

  protected readonly poolService: IPoolService;

  constructor(poolService: IPoolService, routerOptions: RouterOptions = {}) {
    this.poolService = poolService;
    this.routeSuggester = new RouteSuggester();
    this.routeProposals = new Map();
    this.routerOptions = Object.freeze({
      includeOnly: routerOptions.includeOnly ?? [],
    });
  }

  /**
   * Return all pools
   *
   * @returns {PoolBase[]} List of all substrate based pools
   */
  async getPools(): Promise<PoolBase[]> {
    const includeOnly = this.routerOptions.includeOnly;
    return await this.poolService.getPools(includeOnly);
  }

  /**
   * Return list of all available assets from substrate based pools
   *
   * @returns {Asset[]} List of all available assets
   */
  async getTradeableAssets(): Promise<Asset[]> {
    const pools = await this.getPools();
    const asset = this.getAssets(pools);
    return [...new Map(asset).values()];
  }

  /**
   * Calculate and return all possible paths for best swap assetIn>assetOut
   *
   * @param {string} assetIn - Storage key of assetIn
   * @param {string} assetOut - Storage key of assetOut
   * @returns {<Hop[][]>} All possible paths containing route hops
   */
  async getRoutes(assetIn: string, assetOut: string): Promise<Hop[][]> {
    const pools = await this.getPools();
    this.validateInput(assetIn, assetOut, pools);
    return this.getPaths(assetIn, assetOut, pools);
  }

  /**
   * Ckeck if asset pair is valid
   *
   * @param {number} assetIn - assetIn id
   * @param {number} assetOut - assetOut id
   * @param {PoolBase[]} pools - trading pools
   */
  protected validateInput(
    assetIn: string,
    assetOut: string,
    pools: PoolBase[]
  ): Map<string, Pool> {
    if (pools.length === 0) throw new Error('No pools configured');
    if (assetIn === assetOut)
      throw new Error("Trading pair can't be identical");

    const assets = this.getAssets(pools);
    if (assets.get(assetIn) === null)
      throw new Error(assetIn + ' is not supported asset');
    if (assets.get(assetOut) === null)
      throw new Error(assetOut + ' is not supported asset');

    return this.toPoolsMap(pools);
  }

  /**
   * Return map of all available assets from substrate based pools
   *
   * @param pools - pools
   * @returns Map of all available assets
   */
  protected getAssets(pools: PoolBase[]): Map<string, Asset> {
    const assets = pools
      .map((pool: PoolBase) =>
        pool.tokens.map((t) => {
          return {
            id: t.id,
            name: t.name,
            symbol: t.symbol,
            decimals: t.decimals,
            icon: t.icon,
            type: t.type,
            isSufficient: t.isSufficient,
            existentialDeposit: t.existentialDeposit,
            meta: t.meta,
            location: t.location,
            isWhiteListed: t.isWhiteListed,
          } as Asset;
        })
      )
      .flat();
    return new Map(assets.map((asset) => [asset.id, asset]));
  }
  /**
   * Calculate and return all possible paths for best swap assetIn>assetOut
   *
   * @param assetIn - Storage key of assetIn
   * @param assetOut - Storage key of assetOut
   * @param poolsMap - pools map
   * @param pools - pools
   * @returns All possible paths containing route hops
   */
  protected getPaths(
    assetIn: string,
    assetOut: string | null,
    pools: PoolBase[]
  ): Hop[][] {
    const poolsMap = this.toPoolsMap(pools);
    const routeProposals = this.getProposals(assetIn, assetOut, pools);
    const routes = routeProposals
      .filter((path: Edge[]) => this.validPath(path, poolsMap))
      .map((path: Edge[]) => this.toHops(path, poolsMap));
    return routes;
  }

  private getProposals(
    assetIn: string,
    assetOut: string | null,
    pools: PoolBase[]
  ): RouteProposal[] {
    const key = `${assetIn}->${assetOut}::${hashPools(pools)}`;

    if (this.routeProposals.has(key)) {
      return this.routeProposals.get(key)!;
    }

    const proposals = this.routeSuggester.getProposals(
      assetIn,
      assetOut,
      pools
    );
    this.routeProposals.set(key, proposals);
    return proposals;
  }

  /**
   * Check if path is valid -> all edges are valid token pairs
   *
   * @param proposedPath - proposed path
   * @param poolsMap - pools map
   * @returns only valid paths
   */
  private validPath(
    proposedPath: Edge[],
    poolsMap: Map<string, Pool>
  ): boolean {
    return (
      proposedPath.length > 0 &&
      proposedPath
        .map((edge: Edge) => this.validEdge(edge, poolsMap))
        .reduce((prev, curr) => prev && curr)
    );
  }

  /**
   * Check if edge (token pair) of corresponding pool is valid combination
   *
   * @param edge - current edge (token pair)
   * @param poolsMap - pools map
   * @returns true if edge (token pair) is valid, otherwise false
   */
  private validEdge(
    [address, from, to]: Edge,
    poolsMap: Map<string, Pool>
  ): boolean {
    return poolsMap.get(address)?.validatePair(from, to) || false;
  }

  private toPoolsMap(pools: PoolBase[]): Map<string, Pool> {
    return new Map<string, Pool>(
      pools.map((i) => [i.address, PoolFactory.get(i)])
    );
  }

  private toHops(path: Edge[], poolsMap: Map<string, Pool>): Hop[] {
    return path.map(([address, from, to]: Edge) => {
      const pool = poolsMap.get(address);
      return {
        poolAddress: address,
        poolId: pool?.id,
        pool: pool?.type,
        assetIn: from,
        assetOut: to,
      } as Hop;
    });
  }
}
