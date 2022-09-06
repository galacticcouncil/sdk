import {
  PoolService,
  PoolBase,
  Hop,
  Pool,
  PoolAsset,
  Swap,
  SwapOptions,
} from '../../types';
import { RouteSuggester } from '../../suggester';
import { Edge } from '../../suggester';
import { PoolFactory } from '../../pool';
import { BigNumber } from '../../utils/bignumber';
import { calculateTradeFee } from '../../utils/math';

export class TradeRouter {
  private readonly routeSuggester: RouteSuggester;
  private readonly poolService: PoolService;
  private readonly swapOptions: SwapOptions;

  private readonly defaultSwapOptions: SwapOptions = {
    includeOnly: [],
  };

  /**
   * @param poolService - Fetch pool data from substrate based pools
   * @param swapOptions - Optional swap options for router
   */
  constructor(poolService: PoolService, swapOptions?: SwapOptions) {
    this.poolService = poolService;
    this.routeSuggester = new RouteSuggester();
    this.swapOptions = {
      ...this.defaultSwapOptions,
      ...swapOptions,
    };
  }

  /**
   * Return all pools
   *
   * @returns {PoolBase[]} List of all substrate based pools
   */
  async getPools(): Promise<PoolBase[]> {
    const pools = await this.poolService.getPools();
    const poolTypes = new Set(this.swapOptions.includeOnly);
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
    if (pools.length === 0) return [];
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
    if (pools.length === 0) return [];
    const { poolsMap } = await this.validateTokenPair(tokenIn, tokenOut, pools);
    return this.getPaths(tokenIn, tokenOut, poolsMap, pools);
  }

  /**
   * Calculate and return best possible sell price for tokenIn>tokenOut
   *
   * @param {string} tokenIn - Storage key of tokenIn
   * @param {string} tokenOut - Storage key of tokenOut
   * @param {BigNumber} amountIn - Amount of tokenIn to sell for tokenOut
   * @returns Best possible swaps(sells) of given token pair
   */
  async getBestSellPrice(
    tokenIn: string,
    tokenOut: string,
    amountIn: BigNumber
  ): Promise<Swap[]> {
    const pools = await this.getPools();
    if (pools.length === 0) return [];
    const { poolsMap } = await this.validateTokenPair(tokenIn, tokenOut, pools);
    const paths = this.getPaths(tokenIn, tokenOut, poolsMap, pools);
    const swaps = paths.map((path) =>
      this.toSellSwaps(amountIn, path, poolsMap)
    );
    const sorted = swaps.sort((a, b) => {
      const swapAFinal = a[a.length - 1].returnFinalAmount;
      const swapBFinal = b[b.length - 1].returnFinalAmount;
      return swapAFinal.isGreaterThan(swapBFinal) ? -1 : 1;
    });
    return sorted[0];
  }

  /**
   * Calculate and return sell swaps for given path
   * - final amount of previous swap is entry to next one
   *
   * @param amountIn - Amount of tokenIn to sell for tokenOut
   * @param path - current path
   * @param poolsMap - pools map
   * @returns Sell swaps for given path
   */
  private toSellSwaps(
    amountIn: BigNumber,
    path: Hop[],
    poolsMap: Map<string, Pool>
  ): Swap[] {
    const swaps: Swap[] = [];
    for (let i = 0; i < path.length; i++) {
      const hop = path[i];
      const pool = poolsMap.get(hop.poolId);
      if (pool == null) throw new Error('Pool does not exit');

      let aIn: BigNumber;
      if (i > 0) {
        aIn = swaps[i - 1].returnFinalAmount;
      } else {
        aIn = amountIn;
      }

      const poolPair = pool.parsePoolPair(hop.tokenIn, hop.tokenOut);
      const calculated = pool.calculateOutGivenIn(poolPair, aIn);
      const fee = calculateTradeFee(calculated, poolPair.swapFee);
      const spotPrice = pool.getSpotPriceOut(poolPair);

      swaps.push({
        ...hop,
        swapAmount: aIn,
        returnAmount: calculated,
        returnFinalAmount: calculated.minus(fee),
        swapFee: fee,
        spotPrice: spotPrice,
      } as Swap);
    }
    return swaps;
  }

  /**
   * Calculate and return best possible buy price for tokenIn>tokenOut
   *
   * @param {string} tokenIn - Storage key of tokenIn
   * @param {string} tokenOut - Storage key of tokenOut
   * @param {BigNumber} amountOut - Amount of tokenOut to buy for tokenIn
   * @returns Best possible swaps(buys) of given token pair
   */
  async getBestBuyPrice(
    tokenIn: string,
    tokenOut: string,
    amountOut: BigNumber
  ): Promise<Swap[]> {
    const pools = await this.getPools();
    if (pools.length === 0) return [];
    const { poolsMap } = await this.validateTokenPair(tokenIn, tokenOut, pools);
    const paths = this.getPaths(tokenIn, tokenOut, poolsMap, pools);
    const swaps = paths.map((path) =>
      this.toBuySwaps(amountOut, path, poolsMap)
    );
    const sorted = swaps.sort((a, b) => {
      const swapAFinal = a[0].returnFinalAmount;
      const swapBFinal = b[0].returnFinalAmount;
      return swapAFinal.isGreaterThan(swapBFinal) ? 1 : -1;
    });
    return sorted[0];
  }

  /**
   * Calculate and return buy swaps for given path
   * - final amount of previous swap is entry to next one
   * - calculation is done backwards
   *
   * @param amountOut - Amount of tokenOut to buy for tokenIn
   * @param path - current path
   * @param poolsMap - pools map
   * @returns Buy swaps for given path
   */
  private toBuySwaps(
    amountOut: BigNumber,
    path: Hop[],
    poolsMap: Map<string, Pool>
  ): Swap[] {
    const swaps: Swap[] = [];
    for (let i = path.length - 1; i >= 0; i--) {
      const hop = path[i];
      const pool = poolsMap.get(hop.poolId);
      if (pool == null) throw new Error('Pool does not exit');

      let aOut: BigNumber;
      if (i == path.length - 1) {
        aOut = amountOut;
      } else {
        aOut = swaps[0].returnFinalAmount;
      }

      const poolPair = pool.parsePoolPair(hop.tokenIn, hop.tokenOut);
      const calculated = pool.calculateInGivenOut(poolPair, aOut);
      const fee = calculateTradeFee(calculated, poolPair.swapFee);
      const spotPrice = pool.getSpotPriceIn(poolPair);

      swaps.unshift({
        ...hop,
        swapAmount: aOut,
        returnAmount: calculated,
        returnFinalAmount: calculated.plus(fee),
        swapFee: fee,
        spotPrice: spotPrice,
      } as Swap);
    }
    return swaps;
  }

  /**
   * Return map of all available assets from substrate based pools
   *
   * @returns Map of all available assets
   */
  private async getAssets(): Promise<Map<string, PoolAsset>> {
    const pools = await this.getPools();
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

  /**
   * Calculate and return all possible paths for best swap tokenIn>tokenOut
   *
   * @param tokenIn - Storage key of tokenIn
   * @param tokenOut - Storage key of tokenOut
   * @param poolsMap - pools map
   * @param pools - pools
   * @returns All possible paths containing route hops
   */
  private getPaths(
    tokenIn: string,
    tokenOut: string | null,
    poolsMap: Map<string, Pool>,
    pools: PoolBase[]
  ): Hop[][] {
    const routeProposals = this.routeSuggester.getProposals(
      tokenIn,
      tokenOut,
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
   * @param tokenIn - Storage key of tokenIn
   * @param tokenOut - Storage key of tokenOut
   * @returns Pool assets & map
   */
  private async validateTokenPair(
    tokenIn: string,
    tokenOut: string,
    pools: PoolBase[]
  ) {
    const assets = await this.getAssets();
    if (assets.get(tokenIn) == null)
      throw new Error(tokenIn + ' is not supported token');
    if (assets.get(tokenOut) == null)
      throw new Error(tokenOut + ' is not supported token');
    const poolsMap = this.getPoolMap(pools);
    return { assets, poolsMap };
  }

  /**
   * Ckeck if input asset is valid and throw expection if not
   *
   * @param token - Storage key of token
   * @returns Pool assets & map
   */
  private async validateToken(token: string, pools: PoolBase[]) {
    const assets = await this.getAssets();
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
    [id, from, to]: Edge,
    poolsMap: Map<string, Pool>
  ): boolean {
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

  private toPoolAssets(
    tokens: string[],
    assets: Map<string, PoolAsset>
  ): PoolAsset[] {
    return tokens.map((token) => {
      const asset = assets.get(token);
      return {
        token: token,
        symbol: asset?.symbol,
      } as PoolAsset;
    });
  }
}
