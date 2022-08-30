import { PoolService, PoolBase, Hop, Pool, PoolAsset, Swap } from "../types";
import { RouteSuggester } from "../suggester";
import { Edge } from "../suggester";
import * as PoolFactory from "../pool";
import { BigNumber, scale } from "../utils/bignumber";
import { applyTradeFee, TradeType } from "../utils/calc";

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
    this.validateToken(token, "Token", assets);
    const poolsMap = this.getPoolMap(pools);
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
    const pools = await this.poolService.getPools();
    if (pools.length === 0) return [];
    const assets = await this.getAssets();
    this.validateToken(tokenIn, "TokenIn", assets);
    this.validateToken(tokenIn, "TokenOut", assets);
    const poolsMap = this.getPoolMap(pools);
    return this.getPaths(tokenIn, tokenOut, poolsMap, pools);
  }

  /**
   * Calculate and return all possible swaps(sells) for tokenIn>tokenOut
   *
   * @param {string} tokenIn - Storage key of tokenIn
   * @param {string} tokenOut - Storage key of tokenOut
   * @param {BigNumber} amountIn - Amount of tokenIn to sell for tokenOut
   * @returns Possible swaps(sells) of given token pair
   */
  async getBestSellPrice(tokenIn: string, tokenOut: string, amountIn: BigNumber): Promise<Swap[]> {
    const pools = await this.poolService.getPools();
    if (pools.length === 0) return [];
    const assets = await this.getAssets();
    this.validateToken(tokenIn, "TokenIn", assets);
    this.validateToken(tokenOut, "TokenOut", assets);
    const poolsMap = this.getPoolMap(pools);
    const paths = this.getPaths(tokenIn, tokenOut, poolsMap, pools);
    const swaps = paths.map((path) => this.toSwaps(amountIn, path, poolsMap));
    console.log(JSON.stringify(swaps, null, 2));

    return [];
  }

  private toSwaps(amountIn: BigNumber, path: Hop[], poolsMap: Map<string, Pool>): Swap[] {
    const swaps: Swap[] = [];
    for (let i = 0; i < path.length; i++) {
      const hop = path[i];
      const pool = poolsMap.get(hop.poolId);
      if (pool == null) throw new Error("Pool does not exit");

      let aIn: BigNumber;
      if (i > 0) {
        aIn = swaps[i - 1].final; // amount of previous swap is entry to next one
      } else {
        aIn = amountIn;
      }

      const poolPair = pool.parsePoolPair(hop.tokenIn, hop.tokenOut);
      const calculated = pool.calculateOutGivenIn(poolPair, aIn);
      const final = applyTradeFee(calculated, poolPair.swapFee, TradeType.Sell);
      const spotPrice = pool.getSpotPrice(poolPair);
      console.log(scale(calculated, -12).toString());
      console.log(scale(final, -12).toString());

      swaps.push({
        amount: aIn,
        calculated: calculated,
        final: final.decimalPlaces(0, 1),
        fee: calculated.multipliedBy(poolPair.swapFee).decimalPlaces(0, 1),
        spotPrice: spotPrice,
      } as Swap);
    }
    return swaps;
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
   * Create pool map from substrate based pools
   */
  private getPoolMap(pools: PoolBase[]) {
    return new Map<string, Pool>(pools.map((i) => [i.address, PoolFactory.get(i)]));
  }

  /**
   * Ckeck if input asset is valid and throw expection if not
   *
   * @param token - token
   * @param tokenType - token type (in/out)
   * @param assets - supported assets
   */
  private validateToken(token: string, tokenType: string, assets: Map<string, PoolAsset>) {
    if (assets.get(token) == null) throw new Error(tokenType + " is not supported");
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
