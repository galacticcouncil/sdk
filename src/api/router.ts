import { PoolService, PoolBase, Hop, Pool, Router, PoolAsset } from "../types";
import { RouteSuggester } from "../suggester/suggester";
import { Edge } from "../suggester/graph";
import * as PoolFactory from "../pool/poolFactory";

export class TradeRouter implements Router {
  private readonly routeSuggester: RouteSuggester;
  private readonly poolService: PoolService;

  /**
   * @param {PoolService} poolService - Fetch pool data from substrate based pools
   */
  constructor(poolService: PoolService) {
    this.poolService = poolService;
    this.routeSuggester = new RouteSuggester();
  }

  getPools(): Promise<PoolBase[]> {
    return this.poolService.getPools();
  }

  async getAllAssets(): Promise<PoolAsset[]> {
    const asset = await this.getAssets();
    return [...new Map(asset).values()];
  }

  async getAssetPairs(token: string): Promise<PoolAsset[]> {
    const pools = await this.poolService.getPools();
    if (pools.length === 0) return [];
    const assets = await this.getAssets();
    const poolsMap = this.getPoolMap(pools);
    const hops = this.getPaths(token, undefined, poolsMap, pools);
    const dest = hops.map((hop) => hop[hop.length - 1].tokenOut);
    return this.toPoolAssets([...new Set(dest)], assets);
  }

  async getAllPaths(tokenIn: string, tokenOut: string): Promise<Hop[][]> {
    const pools = await this.poolService.getPools();
    if (pools.length === 0) return [];
    const poolsMap = this.getPoolMap(pools);
    return this.getPaths(tokenIn, tokenOut, poolsMap, pools);
  }

  private getPoolMap(pools: PoolBase[]) {
    return new Map<string, Pool>(pools.map((i) => [i.address, PoolFactory.get(i)]));
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
      .filter((path: Edge[]) => path.length > 0 && this.validPath(path, poolsMap))
      .map((path: Edge[]) => this.toHops(path, poolsMap));
    return routes;
  }

  /**
   * Check if path is valid -> all edges are valid token pairs
   *
   * @param proposedPath - proposed path
   * @param poolsMap - pools map
   * @returns only valid paths
   */
  private validPath(proposedPath: Edge[], poolsMap: Map<string, Pool>): boolean {
    return proposedPath
      .map((edge: Edge) => this.validEdge(edge, poolsMap))
      .reduce((prev, curr) => prev && curr);
  }

  /**
   * Check if edge (token pair) is valid
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
