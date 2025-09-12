import { Edge, RouteSuggester, RouteProposal } from './route';

import {
  Hop,
  IPoolCtxProvider,
  Pool,
  PoolBase,
  PoolFactory,
  PoolFilter,
} from '../pool';

export type RouterOptions = PoolFilter;

export class Router {
  private readonly routeSuggester: RouteSuggester;
  private readonly routeProposals: Map<string, RouteProposal[]>;
  private readonly routerOptions: RouterOptions;

  protected readonly ctx: IPoolCtxProvider;

  constructor(ctx: IPoolCtxProvider, routerOptions: RouterOptions = {}) {
    this.ctx = ctx;
    this.routeSuggester = new RouteSuggester();
    this.routeProposals = new Map();
    this.routerOptions = Object.freeze(routerOptions);
  }

  protected buildRouteKey(
    assetIn: number,
    assetOut: number,
    pools: PoolBase[]
  ): string {
    return `${assetIn}->${assetOut}::${pools.length}`;
  }

  /**
   * List trading pools
   */
  async getPools(): Promise<PoolBase[]> {
    return this.ctx.getPools(this.routerOptions);
  }

  /**
   * List all possible trading routes for given pair
   *
   * @param {number} assetIn - assetIn id
   * @param {number} assetOut - assetOut id
   */
  async getRoutes(assetIn: number, assetOut: number): Promise<Hop[][]> {
    const pools = await this.getPools();
    this.validateInput(assetIn, assetOut, pools);
    return this.getPaths(assetIn, assetOut, pools);
  }

  /**
   * List tradeable assets
   */
  async getTradeableAssets(): Promise<number[]> {
    const pools = await this.getPools();
    const assets = this.getAssets(pools);
    return Array.from(assets);
  }

  /**
   * Return list of all routeble assets from substrate based pools
   *
   * @returns {number[]} List of all routeable asset ids
   */
  async getRouteableAssets(toAsset: number): Promise<number[]> {
    const assets = await this.getTradeableAssets();
    const routes = await Promise.all(
      assets
        .filter((a) => a !== toAsset)
        .map((id) => this.getRoutes(id, toAsset))
    );
    return routes
      .filter((r) => r.length > 0)
      .map(([first]) => first[0].assetIn)
      .sort();
  }

  /**
   * Ckeck if asset pair is valid
   *
   * @param {number} assetIn - assetIn id
   * @param {number} assetOut - assetOut id
   * @param {PoolBase[]} pools - trading pools
   */
  protected validateInput(
    assetIn: number,
    assetOut: number,
    pools: PoolBase[]
  ): Map<string, Pool> {
    if (pools.length === 0) throw new Error('No pools configured');
    if (assetIn === assetOut)
      throw new Error("Trading pair can't be identical");

    const assets = this.getAssets(pools);
    if (!assets.has(assetIn))
      throw new Error(assetIn + ' is not supported asset');
    if (!assets.has(assetOut))
      throw new Error(assetOut + ' is not supported asset');

    return this.toPoolsMap(pools);
  }

  /**
   * List tradeable assets ASC
   *
   * @param {PoolBase[]} pools - trading pools
   */
  protected getAssets(pools: PoolBase[]): Set<number> {
    const assets = pools
      .map((pool: PoolBase) => pool.tokens.map((t) => t.id))
      .flat()
      .sort((a, b) => (a > b ? 1 : -1));
    return new Set(assets);
  }

  /**
   * List all possible routes between assetIn & assetOut
   *
   * @param {number} assetIn - assetIn id
   * @param {number} assetOut - assetOut id
   * @param {PoolBase[]} pools - trading pools
   */
  protected getPaths(
    assetIn: number,
    assetOut: number,
    pools: PoolBase[]
  ): Hop[][] {
    const poolsMap = this.toPoolsMap(pools);
    const routeProposals = this.getProposals(assetIn, assetOut, pools);
    return routeProposals
      .filter((path: Edge[]) => this.validPath(path, poolsMap))
      .map((path: Edge[]) => this.toHops(path, poolsMap));
  }

  private getProposals(
    assetIn: number,
    assetOut: number,
    pools: PoolBase[]
  ): RouteProposal[] {
    const key = this.buildRouteKey(assetIn, assetOut, pools);

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
   * Check if path is valid -> all edges are valid asset pairs
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
   * Check if edge (asset pair) of corresponding pool is valid
   *
   * @param edge - current edge (asset pair)
   * @param poolsMap - pools map
   * @returns true if edge (asset pair) is valid, otherwise false
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
