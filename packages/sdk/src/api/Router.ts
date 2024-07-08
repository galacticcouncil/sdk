import { Asset, IPoolService, PoolBase, Hop, Pool, PoolType } from '../types';
import { RouteSuggester } from '../route';
import { Edge } from '../route';
import { PoolFactory } from '../pool';

export type RouterOptions = {
  includeOnly?: PoolType[];
};

export class Router {
  private readonly routeSuggester: RouteSuggester;
  private readonly routerOptions: RouterOptions;
  protected readonly poolService: IPoolService;

  private readonly defaultRouterOptions: RouterOptions = {
    includeOnly: [],
  };

  /**
   * @param poolService - Fetch pool data from substrate based pools
   * @param routerOptions - Optional router options
   */
  constructor(poolService: IPoolService, routerOptions?: RouterOptions) {
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
    const includeOnly = this.routerOptions.includeOnly;
    return await this.poolService.getPools(includeOnly);
  }

  /**
   * Return list of all available assets from substrate based pools
   *
   * @returns {Asset[]} List of all available assets
   */
  async getAllAssets(): Promise<Asset[]> {
    const pools = await this.getPools();
    if (pools.length === 0) throw new Error('No pools configured');
    const asset = await this.getAssets(pools);
    return [...new Map(asset).values()];
  }

  /**
   * Calculate and return list of all assets, given token can be trade with
   *
   * @param {string} asset - Storage key of asset
   * @returns {Asset[]} List of all available assets, given token can be trade with
   */
  async getAssetPairs(asset: string): Promise<Asset[]> {
    const pools = await this.getPools();
    if (pools.length === 0) throw new Error('No pools configured');
    const { assets, poolsMap } = await this.validateToken(asset, pools);
    const hops = this.getPaths(asset, null, poolsMap, pools);
    const dest = hops.map((hop) => hop[hop.length - 1].assetOut);
    return this.toAssets([...new Set(dest)], assets);
  }

  /**
   * Calculate and return all possible paths for best swap assetIn>assetOut
   *
   * @param {string} assetIn - Storage key of assetIn
   * @param {string} assetOut - Storage key of assetOut
   * @returns {<Hop[][]>} All possible paths containing route hops
   */
  async getAllPaths(assetIn: string, assetOut: string): Promise<Hop[][]> {
    const pools = await this.getPools();
    if (pools.length === 0) throw new Error('No pools configured');
    const { poolsMap } = await this.validateTokenPair(assetIn, assetOut, pools);
    return this.getPaths(assetIn, assetOut, poolsMap, pools);
  }

  /**
   * Return map of all available assets from substrate based pools
   *
   * @param pools - pools
   * @returns Map of all available assets
   */
  protected async getAssets(pools: PoolBase[]): Promise<Map<string, Asset>> {
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
            origin: t.origin,
            meta: t.meta,
            externalId: t.externalId,
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
    poolsMap: Map<string, Pool>,
    pools: PoolBase[]
  ): Hop[][] {
    const routeProposals = this.routeSuggester.getProposals(
      assetIn,
      assetOut,
      pools
    );
    const routes = routeProposals
      .filter((path: Edge[]) => this.validPath(path, poolsMap))
      .map((path: Edge[]) => this.toHops(path, poolsMap));
    return routes;
  }

  /**
   * Ckeck if input asset pair is valid and throw expection if not
   *
   * @param assetIn - Storage key of assetIn
   * @param assetOut - Storage key of assetOut
   * @returns Pool assets & map
   */
  protected async validateTokenPair(
    assetIn: string,
    assetOut: string,
    pools: PoolBase[]
  ) {
    const assets = await this.getAssets(pools);
    if (assets.get(assetIn) == null)
      throw new Error(assetIn + ' is not supported token');
    if (assets.get(assetOut) == null)
      throw new Error(assetOut + ' is not supported token');
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
    const assets = await this.getAssets(pools);
    if (assets.get(token) == null)
      throw new Error(token + ' is not supported token');
    const poolsMap = this.getPoolMap(pools);
    return { assets, poolsMap };
  }

  /**
   * Create pool map from substrate based pools
   */
  private getPoolMap(pools: PoolBase[]): Map<string, Pool> {
    return new Map<string, Pool>(
      pools.map((i) => [i.address, PoolFactory.get(i)])
    );
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

  private toAssets(tokens: string[], assets: Map<string, Asset>): Asset[] {
    return tokens.map((token) => assets.get(token)!);
  }
}
