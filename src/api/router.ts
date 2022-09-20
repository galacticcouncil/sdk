import { PoolService, PoolBase, Hop, Pool, PoolAsset, PoolType } from '../types';
import { RouteSuggester } from '../route';
import { Edge } from '../route';
import { PoolFactory } from '../pool';

export type RouterOptions = {
  includeOnly?: PoolType[];
};

export class Router {
  private readonly routeSuggester: RouteSuggester;
  private readonly poolService: PoolService;
  private readonly routerOptions: RouterOptions;

  private readonly defaultRouterOptions: RouterOptions = {
    includeOnly: [],
  };

  /**
   * @param poolService - Fetch pool data from substrate based pools
   * @param routerOptions - Optional router options
   */
  constructor(poolService: PoolService, routerOptions?: RouterOptions) {
    this.poolService = poolService;
    this.routeSuggester = new RouteSuggester();
    this.routerOptions = {
      ...this.defaultRouterOptions,
      ...routerOptions,
    };
  }

  /**
   * Return all pools
   *
   * @returns {PoolBase[]} List of all substrate based pools
   */
  async getPools(): Promise<PoolBase[]> {
    const pools = await this.poolService.getPools();
    const poolTypes = new Set(this.routerOptions.includeOnly);
    if (poolTypes.size === 0) return pools;
    return pools.filter((p: PoolBase) => poolTypes.has(p.type));
  }

  /**
   * Return list of all available assets from substrate based pools
   *
   * @returns {PoolAsset[]} List of all available assets
   */
  async getAllAssets(): Promise<PoolAsset[]> {
    const asset = await this.getAssets();
    return [...new Map(asset).values()];
  }

  /**
   * Calculate and return list of all assets, given token can be trade with
   *
   * @param {string} token - Storage key of token
   * @returns {PoolAsset[]} List of all available assets, given token can be trade with
   */
  async getAssetPairs(token: string): Promise<PoolAsset[]> {
    const pools = await this.getPools();
    if (pools.length === 0) throw new Error('No pools configured');
    const { assets, poolsMap } = await this.validateToken(token, pools);
    const hops = this.getPaths(token, null, poolsMap, pools);
    const dest = hops.map((hop) => hop[hop.length - 1].tokenOut);
    return this.toPoolAssets([...new Set(dest)], assets);
  }

  /**
   * Calculate and return all possible paths for best swap tokenIn>tokenOut
   *
   * @param {string} tokenIn - Storage key of tokenIn
   * @param {string} tokenOut - Storage key of tokenOut
   * @returns {<Hop[][]>} All possible paths containing route hops
   */
  async getAllPaths(tokenIn: string, tokenOut: string): Promise<Hop[][]> {
    const pools = await this.getPools();
    if (pools.length === 0) throw new Error('No pools configured');
    const { poolsMap } = await this.validateTokenPair(tokenIn, tokenOut, pools);
    return this.getPaths(tokenIn, tokenOut, poolsMap, pools);
  }

  /**
   * Return map of all available assets from substrate based pools
   *
   * @returns Map of all available assets
   */
  protected async getAssets(): Promise<Map<string, PoolAsset>> {
    const pools = await this.getPools();
    if (pools.length === 0) throw new Error('No pools configured');
    const assets = pools
      .map((pool: PoolBase) => {
        return pool.tokens.map(({ id, symbol }) => {
          return { token: id, symbol } as PoolAsset;
        });
      })
      .flat();
    return new Map(assets.map((asset) => [asset.token, asset]));
  }

  /**
   * Calculate and return all possible paths for best swap tokenIn>tokenOut
   *
   * @param tokenIn - Storage key of tokenIn
   * @param tokenOut - Storage key of tokenOut
   * @param poolsMap - pools map
   * @param pools - pools
   * @returns All possible paths containing route hops
   */
  protected getPaths(
    tokenIn: string,
    tokenOut: string | null,
    poolsMap: Map<string, Pool>,
    pools: PoolBase[]
  ): Hop[][] {
    const routeProposals = this.routeSuggester.getProposals(tokenIn, tokenOut, pools);
    const routes = routeProposals
      .filter((path: Edge[]) => this.validPath(path, poolsMap))
      .map((path: Edge[]) => this.toHops(path, poolsMap));
    return routes;
  }

  /**
   * Ckeck if input asset pair is valid and throw expection if not
   *
   * @param tokenIn - Storage key of tokenIn
   * @param tokenOut - Storage key of tokenOut
   * @returns Pool assets & map
   */
  protected async validateTokenPair(tokenIn: string, tokenOut: string, pools: PoolBase[]) {
    const assets = await this.getAssets();
    if (assets.get(tokenIn) == null) throw new Error(tokenIn + ' is not supported token');
    if (assets.get(tokenOut) == null) throw new Error(tokenOut + ' is not supported token');
    const poolsMap = this.getPoolMap(pools);
    return { assets, poolsMap };
  }

  /**
   * Ckeck if input asset is valid and throw exception if not
   *
   * @param token - Storage key of token
   * @returns Pool assets & map
   */
  protected async validateToken(token: string, pools: PoolBase[]) {
    const assets = await this.getAssets();
    if (assets.get(token) == null) throw new Error(token + ' is not supported token');
    const poolsMap = this.getPoolMap(pools);
    return { assets, poolsMap };
  }

  /**
   * Create pool map from substrate based pools
   */
  private getPoolMap(pools: PoolBase[]): Map<string, Pool> {
    return new Map<string, Pool>(pools.map((i) => [i.address, PoolFactory.get(i)]));
  }

  /**
   * Check if path is valid -> all edges are valid token pairs
   *
   * @param proposedPath - proposed path
   * @param poolsMap - pools map
   * @returns only valid paths
   */
  private validPath(proposedPath: Edge[], poolsMap: Map<string, Pool>): boolean {
    return (
      proposedPath.length > 0 &&
      proposedPath.map((edge: Edge) => this.validEdge(edge, poolsMap)).reduce((prev, curr) => prev && curr)
    );
  }

  /**
   * Check if edge (token pair) of corresponding pool is valid combination
   *
   * @param edge - current edge (token pair)
   * @param poolsMap - pools map
   * @returns true if edge (token pair) is valid, otherwise false
   */
  private validEdge([id, from, to]: Edge, poolsMap: Map<string, Pool>): boolean {
    return poolsMap.get(id)?.validPair(from, to) || false;
  }

  private toHops(path: Edge[], poolsMap: Map<string, Pool>): Hop[] {
    return path.map(([id, from, to]: Edge) => {
      const pool = poolsMap.get(id);
      return {
        poolId: id,
        poolType: pool?.type,
        tokenIn: from,
        tokenOut: to,
      } as Hop;
    });
  }

  private toPoolAssets(tokens: string[], assets: Map<string, PoolAsset>): PoolAsset[] {
    return tokens.map((token) => {
      const asset = assets.get(token);
      return {
        token: token,
        symbol: asset?.symbol,
      } as PoolAsset;
    });
  }
}
