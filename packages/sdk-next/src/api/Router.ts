import {
  Hop,
  IPoolService,
  PoolFactory,
  PoolBase,
  Pool,
  PoolType,
} from '../pool';
import { Edge, RouteSuggester } from '../route';
import { Asset } from '../types';

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
   * @param poolService - pool data from substrate based pools
   * @param routerOptions - optional router options
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
   * List all pools
   *
   * @returns all pools
   */
  async getPools(): Promise<PoolBase[]> {
    const includeOnly = this.routerOptions.includeOnly;
    return await this.poolService.getPools(includeOnly);
  }

  /**
   * List all available assets from the configured pools
   *
   * @returns all available assets
   */
  async getAllAssets(): Promise<Asset[]> {
    const pools = await this.getPools();
    if (pools.length === 0) throw new Error('No pools configured');
    const asset = await this.getAssets(pools);
    return [...new Map(asset).values()];
  }

  /**
   * List all assets given token can be trade with
   *
   * @param {number} asset - asset id
   * @returns all available assets, given token can be trade with
   */
  async getAssetPairs(asset: number): Promise<Asset[]> {
    const pools = await this.getPools();
    if (pools.length === 0) throw new Error('No pools configured');
    const { assets, poolsMap } = await this.validateToken(asset, pools);
    const hops = this.getPaths(asset, null, poolsMap, pools);
    const dest = hops.map((hop) => hop[hop.length - 1].assetOut);
    return this.toAssets([...new Set(dest)], assets);
  }

  /**
   * List all possible paths for best swap assetIn>assetOut
   *
   * @param {number} assetIn - assetIn id
   * @param {number} assetOut - assetOut id
   * @returns all possible paths containing route hops
   */
  async getAllPaths(assetIn: number, assetOut: number): Promise<Hop[][]> {
    const pools = await this.getPools();
    if (pools.length === 0) throw new Error('No pools configured');
    const { poolsMap } = await this.validateTokenPair(assetIn, assetOut, pools);
    return this.getPaths(assetIn, assetOut, poolsMap, pools);
  }

  /**
   * List all available assets from pools
   *
   * @param {PoolBase[]} pools - pools
   * @returns map of all available assets
   */
  protected async getAssets(pools: PoolBase[]): Promise<Map<number, Asset>> {
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
   * List all possible paths for best swap assetIn>assetOut
   *
   * @param {number} assetIn - assetIn id
   * @param {number} assetOut - assetOut id
   * @param {Map<string, Pool>} poolsMap - pools map
   * @param {PoolBase[]} pools - pools
   * @returns all possible paths containing route hops
   */
  protected getPaths(
    assetIn: number,
    assetOut: number | null,
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
   * Ckeck if input asset pair is valid
   *
   * @param {number} assetIn - assetIn id
   * @param {number} assetOut - assetOut id
   * @param {PoolBase[]} pools - pools
   * @returns pool assets & map
   */
  protected async validateTokenPair(
    assetIn: number,
    assetOut: number,
    pools: PoolBase[]
  ) {
    const assets = await this.getAssets(pools);
    if (assets.get(assetIn) == null)
      throw new Error(assetIn + ' is not supported asset');
    if (assets.get(assetOut) == null)
      throw new Error(assetOut + ' is not supported asset');
    const poolsMap = this.getPoolMap(pools);
    return { assets, poolsMap };
  }

  /**
   * Ckeck if input asset is valid
   *
   * @param {number} asset - asset id
   * @returns pool assets & map
   */
  protected async validateToken(asset: number, pools: PoolBase[]) {
    const assets = await this.getAssets(pools);
    if (assets.get(asset) == null)
      throw new Error(asset + ' is not supported asset');
    const poolsMap = this.getPoolMap(pools);
    return { assets, poolsMap };
  }

  /**
   * Create pool map by address
   *
   * @param {PoolBase[]} pools - pools
   * @returns pools map
   */
  private getPoolMap(pools: PoolBase[]): Map<string, Pool> {
    return new Map<string, Pool>(
      pools.map((i) => [i.address, PoolFactory.get(i)])
    );
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

  private toAssets(assets: number[], assetsMap: Map<number, Asset>): Asset[] {
    return assets.map((asset) => assetsMap.get(asset)!);
  }
}
