import { PoolService, PoolBase, Hop, Pool, PoolAsset } from "../types";
import { RouteSuggester } from "../suggester/suggester";
import { Edge } from "../suggester/graph";
import * as PoolFactory from "../pool/poolFactory";

export class Router {
  private readonly routeSuggester: RouteSuggester;
  private readonly poolService: PoolService;

  /**
   * @param poolService - Fetch pool data from substrate based pools
   */
  constructor(poolService: PoolService) {
    this.poolService = poolService;
    this.routeSuggester = new RouteSuggester();
  }

  /**
   * Return all pools
   *
   * @returns {PoolBase[]} List of all substrate based pools
   */
  getPools(): Promise<PoolBase[]> {
    return this.poolService.getPools();
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
    const pools = await this.poolService.getPools();
    if (pools.length === 0) return [];
    const assets = await this.getAssets();
    const poolsMap = this.getPoolMap(pools);
    const hops = this.getPaths(token, undefined, poolsMap, pools);
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
    const pools = await this.poolService.getPools();
    if (pools.length === 0) return [];
    const poolsMap = this.getPoolMap(pools);
    return this.getPaths(tokenIn, tokenOut, poolsMap, pools);
  }

  private async getAssets(): Promise<Map<string, PoolAsset>> {
    const pools = await this.poolService.getPools();
    if (pools.length === 0) return new Map<string, PoolAsset>();
    const assets = pools
      .map((pool: PoolBase) => {
        return pool.tokens.map(({ id, symbol }) => {
          return { token: id, symbol } as PoolAsset;
        });
      })
      .flat();
    return new Map(assets.map((asset) => [asset.token, asset]));
  }

  private getPaths(
    tokenIn: string,
    tokenOut: string | undefined,
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
   * Create pool map from substrate based pools
   */
  private getPoolMap(pools: PoolBase[]) {
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
        fee: pool?.swapFee,
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
