import { Router, RouterOptions } from './Router';

import { RouteNotFound } from '../errors';
import {
  Hop,
  IPoolService,
  Pool,
  PoolBase,
  PoolFees,
  PoolPair,
  PoolType,
} from '../pool';
import { Amount } from '../types';
import { bnum, scale, toDecimals } from '../utils/bignumber';
import { FeeUtils } from '../utils/fee';
import {
  calculateSellFee,
  calculateBuyFee,
  calculateDiffToRef,
} from '../utils/math';

import { BuySwap, SellSwap, Swap, Trade, TradeType } from './types';

type Ctx = {
  paths: Hop[][];
  pools: PoolBase[];
  poolsMap: Map<string, Pool>;
};

export class TradeRouter extends Router {
  private readonly mlr: Map<string, Hop[]>;
  private poolsSnapshot?: PoolBase[];

  constructor(poolService: IPoolService, routerOptions: RouterOptions = {}) {
    super(poolService, routerOptions);
    this.mlr = new Map();
  }

  private buildCtxSync(assetIn: string, assetOut: string): Ctx {
    const pools = this.poolsSnapshot!;
    const poolsMap = super.validateInput(assetIn, assetOut, pools);
    const paths = super.getPaths(assetIn, assetOut, pools);
    if (!paths.length) throw new RouteNotFound(assetIn, assetOut);
    return { paths, pools, poolsMap };
  }

  private async withCtx<T>(
    assetIn: string,
    assetOut: string,
    fn: (ctx: Ctx) => Promise<T> | T
  ): Promise<T> {
    if (!this.poolsSnapshot) this.poolsSnapshot = await super.getPools();
    const ctx = this.buildCtxSync(assetIn, assetOut);
    return fn(ctx);
  }

  /**
   * Check whether trade is direct or not
   *
   * @param swaps - trade route
   * @returns true if direct trade, otherwise false
   */
  private isDirectTrade(route: Swap[]) {
    return route.length == 1;
  }

  /**
   * Find best sell swap without errors, if there is none return first one found
   *
   * @param swaps - sell routes
   * @returns best sell route if exist, otherwise first one found
   */
  private findBestSellRoute(swaps: SellSwap[][]): SellSwap[] {
    const sortedResults = swaps.sort((a, b) => {
      const swapAFinal = a[a.length - 1].amountOut;
      const swapBFinal = b[b.length - 1].amountOut;
      return swapAFinal.isGreaterThan(swapBFinal) ? -1 : 1;
    });

    return (
      sortedResults.find((route: SellSwap[]) =>
        route.every((swap: SellSwap) => swap.errors.length == 0)
      ) || sortedResults[0]
    );
  }

  /**
   * Return route fee range [min,max] in case pool is using dynamic fees
   *
   * @param swaps - trade route
   * @returns min & max fee range if swap through the pool with dynamic fees support
   */
  private getRouteFeeRange(route: Swap[]): [number, number] | undefined {
    const hasDynFee = route.filter((s: Swap) => s.tradeFeeRange).length > 0;
    if (hasDynFee) {
      const min = route
        .map((s: Swap) => s.tradeFeeRange?.[0] ?? s.tradeFeePct)
        .reduce((a: number, b: number) => a + b);
      const max = route
        .map((s: Swap) => s.tradeFeeRange?.[1] ?? s.tradeFeePct)
        .reduce((a: number, b: number) => a + b);
      return [min, max];
    }
  }

  /**
   * Return pool fee range [min,max] in case pool is using dynamic fees
   *
   * @param fees - Pool fees
   * @returns min & max fee range if swap through the pool with dynamic fees support
   */
  private getPoolFeeRange(fees: PoolFees): [number, number] | undefined {
    const feeMin = fees.min ? FeeUtils.toPct(fees.min) : undefined;
    const feeMax = fees.max ? FeeUtils.toPct(fees.max) : undefined;
    if (feeMin && feeMax) {
      return [feeMin, feeMax];
    }
    return undefined;
  }

  /**
   * Calculate and return best possible sell trade for assetIn > assetOut pair
   *
   * @param {string} assetIn - asset in
   * @param {string} assetOut - asset out
   * @param {BigNumber} amountIn - amount of assetIn to sell for assetOut
   * @returns best possible sell trade of given asset pair
   */
  async getBestSell(
    assetIn: string,
    assetOut: string,
    amountIn: BigNumber | string | number
  ): Promise<Trade> {
    return this.getSell(assetIn, assetOut, amountIn);
  }

  /**
   * Calculate and return sell trade for assetIn > assetOut pair
   *
   * @param {string} assetIn - asset in
   * @param {string} assetOut - asset out
   * @param {BigNumber} amountIn - amount of assetIn to sell for assetOut
   * @param {Hop[]} route - explicit route to use for trade
   * @returns sell trade of given asset pair
   */
  async getSell(
    assetIn: string,
    assetOut: string,
    amountIn: BigNumber | string | number,
    route?: Hop[]
  ): Promise<Trade> {
    return this.withCtx(assetIn, assetOut, async ({ paths, poolsMap }) => {
      let swaps: SellSwap[];
      if (route) {
        swaps = await this.toSellSwaps(amountIn, route, poolsMap);
      } else {
        const promises = paths.map((path) =>
          this.toSellSwaps(amountIn, path, poolsMap)
        );
        const routes = await Promise.all(promises);
        swaps = this.findBestSellRoute(routes);
      }

      return this.buildSell(poolsMap, swaps);
    });
  }

  /**
   * Calculate and return all possible sell trades for assetIn > assetOut
   *
   * @param {string} assetIn - asset in
   * @param {string} assetOut - asset out
   * @param {BigNumber} amountIn - amount of assetIn to sell for assetOut
   * @returns possible sell trades of given asset pair
   */
  async getSellTrades(
    assetIn: string,
    assetOut: string,
    amountIn: BigNumber | string | number
  ): Promise<Trade[]> {
    return this.withCtx(assetIn, assetOut, async ({ paths, poolsMap }) => {
      const promises = paths.map((path) =>
        this.toSellSwaps(amountIn, path, poolsMap)
      );
      const routes = await Promise.all(promises);

      return routes
        .filter((route) =>
          route.every((swap: SellSwap) => swap.errors.length == 0)
        )
        .map((route) => this.buildSell(poolsMap, route))
        .sort((a, b) => {
          return a.amountOut.isGreaterThan(b.amountOut) ? -1 : 1;
        });
    });
  }

  /**
   * Build sell trade
   *
   * @param poolsMap - pools map
   * @param route - sell route
   * @returns - sell trade
   */
  private buildSell(poolsMap: Map<string, Pool>, route: SellSwap[]) {
    const firstSwap = route[0];
    const lastSwap = route[route.length - 1];
    const isDirect = this.isDirectTrade(route);

    const spotPrice = route
      .map((s: SellSwap) => s.spotPrice.shiftedBy(-1 * s.assetOutDecimals))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b));

    const bestRouteSpotPrice = scale(spotPrice, lastSwap.assetOutDecimals);

    const delta0Y = isDirect
      ? lastSwap.calculatedOut
      : this.calculateDelta0Y(firstSwap.amountIn, route, poolsMap);
    const deltaY = lastSwap.amountOut;

    const tradeFeePct = isDirect
      ? lastSwap.tradeFeePct
      : calculateSellFee(delta0Y, deltaY).toNumber();
    const tradeFee = delta0Y.minus(deltaY);
    const tradeFeeRange = this.getRouteFeeRange(route);

    const swapAmount = firstSwap.amountIn
      .shiftedBy(-1 * firstSwap.assetInDecimals)
      .multipliedBy(bestRouteSpotPrice);

    const bestRoutePriceImpact = calculateDiffToRef(delta0Y, swapAmount);

    return {
      type: TradeType.Sell,
      amountIn: firstSwap.amountIn,
      amountOut: lastSwap.amountOut,
      spotPrice: bestRouteSpotPrice,
      tradeFee: tradeFee,
      tradeFeePct: tradeFeePct,
      tradeFeeRange: tradeFeeRange,
      priceImpactPct: bestRoutePriceImpact.toNumber(),
      swaps: route,
      toHuman() {
        return {
          type: TradeType.Sell,
          amountIn: toDecimals(firstSwap.amountIn, firstSwap.assetInDecimals),
          amountOut: toDecimals(lastSwap.amountOut, lastSwap.assetOutDecimals),
          spotPrice: toDecimals(bestRouteSpotPrice, lastSwap.assetOutDecimals),
          tradeFee: toDecimals(tradeFee, lastSwap.assetOutDecimals),
          tradeFeePct: tradeFeePct,
          tradeFeeRange: tradeFeeRange,
          priceImpactPct: bestRoutePriceImpact.toNumber(),
          swaps: route.map((s: SellSwap) => s.toHuman()),
        };
      },
    } as Trade;
  }

  /**
   * Calculates the output amount of a trade assuming fees are zero
   *
   * @param amountIn - amount of assetIn to sell for assetOut
   * @param route - trade route
   * @param poolsMap - pools map
   * @returns the amount out if fees are zero
   */
  private calculateDelta0Y(
    amountIn: BigNumber,
    route: SellSwap[],
    poolsMap: Map<string, Pool>
  ) {
    const amounts: BigNumber[] = [];
    for (let i = 0; i < route.length; i++) {
      const swap = route[i];
      const pool = poolsMap.get(swap.poolAddress);
      if (pool == null) throw new Error('Pool does not exit');
      const poolPair = pool.parsePair(swap.assetIn, swap.assetOut);
      let aIn: BigNumber;
      if (i > 0) {
        aIn = amounts[i - 1];
      } else {
        aIn = amountIn;
      }
      const calculatedOut = pool.calculateOutGivenIn(poolPair, aIn);
      amounts.push(calculatedOut);
    }
    return amounts[amounts.length - 1];
  }

  /**
   * Calculate and cache the most liquid route
   *
   * To avoid routing through the pools with low liquidity, 0.1% from the
   * most liquid pool asset is used as reference value to determine the
   * sweet spot.
   *
   * @param {string} assetIn - asset in
   * @param {string} assetOut - asset out
   * @param {Ctx} ctx - route ctx
   * @return most liquid route of given asset pair
   */
  private async calculateMostLiquidRoute(
    assetIn: string,
    assetOut: string,
    ctx: Ctx
  ): Promise<Hop[]> {
    const { paths, pools, poolsMap } = ctx;

    // Get pools with assetIn
    const assetInPools = pools.filter((pool) =>
      pool.tokens.some((t) => t.id === assetIn)
    );

    // Get liquidity of assetIn sorted by DESC
    const assetInLiquidityDesc = assetInPools
      .map((p) => {
        return p.type === PoolType.Aave
          ? p.tokens
          : p.tokens.filter((t) => t.id === assetIn);
      })
      .map((t) => {
        return t
          .map((t) => bnum(t.balance).shiftedBy(-1 * t.decimals))
          .reduce((a, b) => a.plus(b));
      })
      .sort((a, b) => (b.isLessThan(a) ? -1 : 1));

    const liquidity = assetInLiquidityDesc[0];
    const liquidityIn = liquidity.div(100).multipliedBy(0.1);
    const routesPromises = paths.map(
      async (path) => await this.toSellSwaps(liquidityIn, path, poolsMap)
    );
    const routes = await Promise.all(routesPromises);
    const route = this.findBestSellRoute(routes);
    const mlr = route.map((r) => {
      return {
        poolAddress: r.poolAddress,
        poolId: r?.poolId,
        pool: r.pool,
        assetIn: r.assetIn,
        assetOut: r.assetOut,
      } as Hop;
    });

    const key = this.buildRouteKey(assetIn, assetOut, pools);
    this.mlr.set(key, mlr);
    return mlr;
  }

  /**
   * Calculate and return sell route for given path
   *
   * @param amountIn - amount of assetIn to sell for assetOut
   * @param path - current path
   * @param poolsMap - pools map
   * @returns sell route for given path with corresponding pool pairs
   */
  async toSellSwaps(
    amountIn: BigNumber | string | number,
    path: Hop[],
    poolsMap: Map<string, Pool>
  ): Promise<SellSwap[]> {
    const pools: Pool[] = [];
    const pairs: PoolPair[] = [];

    for (let i = 0; i < path.length; i++) {
      const hop = path[i];
      const pool = poolsMap.get(hop.poolAddress);
      if (!pool) throw new Error('Pool does not exit');
      const pair = pool.parsePair(hop.assetIn, hop.assetOut);
      pools[i] = pool;
      pairs[i] = pair;
    }

    const fees = await Promise.all(
      pairs.map((pair, i) => this.poolService.getPoolFees(pair, pools[i]))
    );

    const swaps: SellSwap[] = [];

    for (let i = 0; i < path.length; i++) {
      const hop = path[i];
      const pool = pools[i];
      const poolFees = fees[i];
      const poolPair = pairs[i];

      let aIn: BigNumber;
      if (i > 0) {
        aIn = swaps[i - 1].amountOut;
      } else {
        aIn = scale(bnum(amountIn), poolPair.decimalsIn).decimalPlaces(0, 1);
      }

      const { amountOut, calculatedOut, feePct, errors } = pool.validateAndSell(
        poolPair,
        aIn,
        poolFees
      );
      const feePctRange = this.getPoolFeeRange(poolFees);
      const spotPrice = pool.spotPriceOutGivenIn(poolPair);
      const swapAmount = aIn
        .shiftedBy(-1 * poolPair.decimalsIn)
        .multipliedBy(spotPrice);
      const priceImpactPct = calculateDiffToRef(calculatedOut, swapAmount);

      const isAave = pool.type === PoolType.Aave;
      swaps.push({
        ...hop,
        assetInDecimals: poolPair.decimalsIn,
        assetOutDecimals: poolPair.decimalsOut,
        amountIn: aIn,
        amountOut,
        calculatedOut,
        spotPrice,
        tradeFeePct: feePct,
        tradeFeeRange: feePctRange,
        priceImpactPct: priceImpactPct.toNumber(),
        errors,
        isSupply: () => isAave && pool.tokens[0].id === hop.assetIn,
        isWithdraw: () => isAave && pool.tokens[1].id === hop.assetIn,
        toHuman() {
          return {
            ...hop,
            amountIn: toDecimals(aIn, poolPair.decimalsIn),
            amountOut: toDecimals(amountOut, poolPair.decimalsOut),
            calculatedOut: toDecimals(calculatedOut, poolPair.decimalsOut),
            spotPrice: toDecimals(spotPrice, poolPair.decimalsOut),
            tradeFeePct: feePct,
            priceImpactPct: priceImpactPct.toNumber(),
            errors: errors,
          };
        },
      });
    }
    return swaps;
  }

  /**
   * Returns the most liquid route
   *
   * @param {string} assetIn - asset in
   * @param {string} assetOut - asset out
   * @return most liquid route of given asset pair
   */
  async getMostLiquidRoute(assetIn: string, assetOut: string): Promise<Hop[]> {
    return this.withCtx(assetIn, assetOut, async (ctx) => {
      const routeKey = this.buildRouteKey(assetIn, assetOut, ctx.pools);
      const route = this.mlr.get(routeKey);
      if (route) {
        return route;
      }
      return this.calculateMostLiquidRoute(assetIn, assetOut, ctx);
    });
  }

  /**
   * Calculate and return best possible spot price for assetIn > assetOut pair
   *
   * @param {string} assetIn - asset in
   * @param {string} assetOut - asset out
   * @return best possible spot price of given asset pair, or undefined if trade not supported
   */
  async getBestSpotPrice(
    assetIn: string,
    assetOut: string
  ): Promise<Amount | undefined> {
    return this.withCtx(assetIn, assetOut, async (ctx) => {
      const { pools, poolsMap } = ctx;

      const routeKey = this.buildRouteKey(assetIn, assetOut, pools);
      let route = this.mlr.get(routeKey);
      if (!route) {
        route = await this.calculateMostLiquidRoute(assetIn, assetOut, ctx);
      }

      const swaps = await this.toSellSwaps('1', route, poolsMap);
      const spotPrice = swaps
        .map((s: SellSwap) => s.spotPrice.shiftedBy(-1 * s.assetOutDecimals))
        .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b));
      const spotPriceDecimals = swaps[swaps.length - 1].assetOutDecimals;
      const spotPriceAmount = scale(spotPrice, spotPriceDecimals);
      return { amount: spotPriceAmount, decimals: spotPriceDecimals };
    }).catch(() => undefined);
  }

  /**
   * Find best buy route without errors, if there is none return first one found
   *
   * @param swaps - buy routes
   * @returns best buy route if exist, otherwise first one found
   */
  private findBestBuyRoute(swaps: BuySwap[][]): BuySwap[] {
    const sortedResults = swaps.sort((a, b) => {
      const swapAFinal = a[0].amountIn;
      const swapBFinal = b[0].amountIn;
      return swapAFinal.isGreaterThan(swapBFinal) ? 1 : -1;
    });

    return (
      sortedResults.find((route: BuySwap[]) =>
        route.every((swap: BuySwap) => swap.errors.length == 0)
      ) || sortedResults[0]
    );
  }

  /**
   * Calculate and return best possible buy trade for assetIn > assetOut pair
   *
   * @param {string} assetIn - asset in
   * @param {string} assetOut - asset out
   * @param {BigNumber} amountOut - amount of assetOut to buy for assetIn
   * @returns best possible buy trade of given asset pair
   */
  async getBestBuy(
    assetIn: string,
    assetOut: string,
    amountOut: BigNumber | string | number
  ): Promise<Trade> {
    return this.getBuy(assetIn, assetOut, amountOut);
  }

  /**
   * Calculate and return buy trade for assetIn > assetOut pair
   *
   * @param {string} assetIn - asset in
   * @param {string} assetOut - asset out
   * @param {BigNumber} amountOut - amount of assetOut to buy for assetIn
   * @param {Hop[]} route - explicit route to use for trade
   * @returns buy trade of given asset pair
   */
  async getBuy(
    assetIn: string,
    assetOut: string,
    amountOut: BigNumber | string | number,
    route?: Hop[]
  ): Promise<Trade> {
    return this.withCtx(assetIn, assetOut, async ({ paths, poolsMap }) => {
      let swaps: BuySwap[];
      if (route) {
        swaps = await this.toBuySwaps(amountOut, route, poolsMap);
      } else {
        const promises = paths.map((path) =>
          this.toBuySwaps(amountOut, path, poolsMap)
        );
        const routes = await Promise.all(promises);
        swaps = this.findBestBuyRoute(routes);
      }

      return this.buildBuy(poolsMap, swaps);
    });
  }

  /**
   * Calculate and return all possible buy trades for assetIn > assetOut
   *
   * @param {string} assetIn - asset in
   * @param {string} assetOut - asset out
   * @param {BigNumber} amountOut - amount of assetOut to buy for assetIn
   * @returns possible buy trades of given asset pair
   */
  async getBuyTrades(
    assetIn: string,
    assetOut: string,
    amountOut: BigNumber | string | number
  ): Promise<Trade[]> {
    return this.withCtx(assetIn, assetOut, async ({ paths, poolsMap }) => {
      const promises = paths.map((path) =>
        this.toBuySwaps(amountOut, path, poolsMap)
      );
      const routes = await Promise.all(promises);

      return routes
        .filter((route) =>
          route.every((swap: BuySwap) => swap.errors.length == 0)
        )
        .map((route) => this.buildBuy(poolsMap, route))
        .sort((a, b) => {
          return a.amountIn.isGreaterThan(b.amountIn) ? 1 : -1;
        });
    });
  }

  /**
   * Build buy trade
   *
   * @param poolsMap - pools map
   * @param route - buy route
   * @returns - buy trade
   */
  private buildBuy(poolsMap: Map<string, Pool>, route: BuySwap[]) {
    const firstSwap = route[route.length - 1];
    const lastSwap = route[0];
    const isDirect = this.isDirectTrade(route);

    const spotPrice = route
      .map((s: BuySwap) => s.spotPrice.shiftedBy(-1 * s.assetInDecimals))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b));

    const bestRouteSpotPrice = scale(spotPrice, lastSwap.assetInDecimals);

    const delta0X = isDirect
      ? lastSwap.calculatedIn
      : this.calculateDelta0X(firstSwap.amountOut, route, poolsMap);
    const deltaX = lastSwap.amountIn;

    const tradeFeePct = isDirect
      ? lastSwap.tradeFeePct
      : calculateBuyFee(delta0X, deltaX).toNumber();
    const tradeFee = deltaX.minus(delta0X);
    const tradeFeeRange = this.getRouteFeeRange(route);

    const swapAmount = firstSwap.amountOut
      .shiftedBy(-1 * firstSwap.assetOutDecimals)
      .multipliedBy(bestRouteSpotPrice);

    let bestRoutePriceImpact: number;
    if (delta0X.isZero()) {
      bestRoutePriceImpact = -100;
    } else {
      bestRoutePriceImpact = calculateDiffToRef(swapAmount, delta0X).toNumber();
    }

    return {
      type: TradeType.Buy,
      amountOut: firstSwap.amountOut,
      amountIn: lastSwap.amountIn,
      spotPrice: bestRouteSpotPrice,
      tradeFee: tradeFee,
      tradeFeePct: tradeFeePct,
      tradeFeeRange: tradeFeeRange,
      priceImpactPct: bestRoutePriceImpact,
      swaps: route,
      toHuman() {
        return {
          type: TradeType.Buy,
          amountOut: toDecimals(
            firstSwap.amountOut,
            firstSwap.assetOutDecimals
          ),
          amountIn: toDecimals(lastSwap.amountIn, lastSwap.assetInDecimals),
          spotPrice: toDecimals(bestRouteSpotPrice, lastSwap.assetInDecimals),
          tradeFee: toDecimals(tradeFee, lastSwap.assetInDecimals),
          tradeFeePct: tradeFeePct,
          tradeFeeRange: tradeFeeRange,
          priceImpactPct: bestRoutePriceImpact,
          swaps: route.map((s: BuySwap) => s.toHuman()),
        };
      },
    } as Trade;
  }

  /**
   * Calculates the required input amount for a trade to receive a desired output amount,
   * assuming fees are zero.
   *
   * @param amountOut - amount of assetOut to buy for assetIn
   * @param route - trade route
   * @param poolsMap - pools map
   * @returns the required input amount for a trade if fees are zero
   */
  private calculateDelta0X(
    amountOut: BigNumber,
    route: BuySwap[],
    poolsMap: Map<string, Pool>
  ) {
    const amounts: BigNumber[] = [];
    for (let i = route.length - 1; i >= 0; i--) {
      const swap = route[i];
      const pool = poolsMap.get(swap.poolAddress);
      if (pool == null) throw new Error('Pool does not exit');
      const poolPair = pool.parsePair(swap.assetIn, swap.assetOut);
      let aOut: BigNumber;
      if (i == route.length - 1) {
        aOut = amountOut;
      } else {
        aOut = amounts[0];
      }
      const calculatedIn = pool.calculateInGivenOut(poolPair, aOut);
      amounts.unshift(calculatedIn);
    }
    return amounts[0];
  }

  /**
   * Calculate and return buy route for given path
   *
   * @param amountOut - amount of assetOut to buy for assetIn
   * @param path - current path
   * @param poolsMap - pools map
   * @returns buy route for given path
   */
  async toBuySwaps(
    amountOut: BigNumber | string | number,
    path: Hop[],
    poolsMap: Map<string, Pool>
  ): Promise<BuySwap[]> {
    const pools: Pool[] = [];
    const pairs: PoolPair[] = [];

    for (let i = 0; i < path.length; i++) {
      const hop = path[i];
      const pool = poolsMap.get(hop.poolAddress);
      if (!pool) throw new Error('Pool does not exit');
      const pair = pool.parsePair(hop.assetIn, hop.assetOut);
      pools[i] = pool;
      pairs[i] = pair;
    }

    const fees = await Promise.all(
      pairs.map((pair, i) => this.poolService.getPoolFees(pair, pools[i]))
    );

    const swaps: BuySwap[] = [];

    for (let i = path.length - 1; i >= 0; i--) {
      const hop = path[i];
      const pool = pools[i];
      const poolFees = fees[i];
      const poolPair = pairs[i];

      let aOut: BigNumber;
      if (i == path.length - 1) {
        aOut = scale(bnum(amountOut), poolPair.decimalsOut).decimalPlaces(0, 1);
      } else {
        aOut = swaps[0].amountIn;
      }

      const { amountIn, calculatedIn, feePct, errors } = pool.validateAndBuy(
        poolPair,
        aOut,
        poolFees
      );
      const feePctRange = this.getPoolFeeRange(poolFees);
      const spotPrice = pool.spotPriceInGivenOut(poolPair);

      const swapAmount = aOut
        .shiftedBy(-1 * poolPair.decimalsOut)
        .multipliedBy(spotPrice);
      let priceImpactPct: number;
      if (calculatedIn.isZero()) {
        priceImpactPct = -100;
      } else {
        priceImpactPct = calculateDiffToRef(
          swapAmount,
          calculatedIn
        ).toNumber();
      }

      swaps.unshift({
        ...hop,
        assetInDecimals: poolPair.decimalsIn,
        assetOutDecimals: poolPair.decimalsOut,
        amountIn: amountIn,
        amountOut: aOut,
        calculatedIn: calculatedIn,
        spotPrice: spotPrice,
        tradeFeePct: feePct,
        tradeFeeRange: feePctRange,
        priceImpactPct: priceImpactPct,
        errors: errors,
        isSupply() {
          return (
            pool.type === PoolType.Aave && pool.tokens[0].id === hop.assetIn
          );
        },
        isWithdraw() {
          return (
            pool.type === PoolType.Aave && pool.tokens[1].id === hop.assetIn
          );
        },
        toHuman() {
          return {
            ...hop,
            amountIn: toDecimals(amountIn, poolPair.decimalsIn),
            amountOut: toDecimals(aOut, poolPair.decimalsOut),
            calculatedIn: toDecimals(calculatedIn, poolPair.decimalsIn),
            spotPrice: toDecimals(spotPrice, poolPair.decimalsIn),
            tradeFeePct: feePct,
            tradeFeeRange: feePctRange,
            priceImpactPct: priceImpactPct,
            errors: errors,
          };
        },
      } as BuySwap);
    }
    return swaps;
  }
}
