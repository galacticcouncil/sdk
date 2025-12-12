import { big } from '@galacticcouncil/common';

import { Router } from './Router';
import { BuySwap, SellSwap, Swap, Trade, TradeType } from './types';

import { RouteNotFound } from '../errors';
import {
  Hop,
  IPoolCtxProvider,
  Pool,
  PoolBase,
  PoolFees,
  PoolType,
} from '../pool';
import { Amount } from '../types';
import { fmt, math } from '../utils';

const { FeeUtils } = fmt;

type Ctx = {
  paths: Hop[][];
  pools: PoolBase[];
  poolsMap: Map<string, Pool>;
};

export class TradeRouter extends Router {
  private readonly mlr: Map<string, Hop[]>;

  constructor(ctx: IPoolCtxProvider) {
    super(ctx);
    this.mlr = new Map();
  }

  protected override onFilterChanged(): void {
    this.mlr.clear();
  }

  private buildCtxSync(
    assetIn: number,
    assetOut: number,
    pools: PoolBase[]
  ): Ctx {
    const poolsMap = super.validateInput(assetIn, assetOut, pools);
    const paths = super.getPaths(assetIn, assetOut, pools);
    if (!paths.length) throw new RouteNotFound(assetIn, assetOut);
    return { paths, pools, poolsMap };
  }

  private async withCtx<T>(
    assetIn: number,
    assetOut: number,
    fn: (ctx: Ctx) => Promise<T> | T
  ): Promise<T> {
    const pools = await super.getPools();
    const ctx = this.buildCtxSync(assetIn, assetOut, pools);
    return fn(ctx);
  }

  /**
   * Check whether trade is direct or not
   *
   * @param {Swap[]} swaps - trade route swaps
   * @returns true if direct trade, otherwise false
   */
  private isDirectTrade(swaps: Swap[]) {
    return swaps.length == 1;
  }

  /**
   * Find the best sell route
   *
   * @param {SellSwap[]} swaps - sell routes
   * @returns the most beneficial route without errors, if exist
   */
  private findBestSellRoute(swaps: SellSwap[][]): SellSwap[] {
    const sortedResults = swaps.sort((a, b) => {
      const swapAFinal = a[a.length - 1].amountOut;
      const swapBFinal = b[b.length - 1].amountOut;
      return swapAFinal > swapBFinal ? -1 : 1;
    });

    return (
      sortedResults.find((route: SellSwap[]) =>
        route.every((swap: SellSwap) => swap.errors.length == 0)
      ) || sortedResults[0]
    );
  }

  /**
   * Route fee range [min,max] in case pool is using dynamic fees
   *
   * @param {Swap[]} swaps - trade routes
   * @returns min & max fee range if swapping through the pool with
   * dynamic fees support
   */
  private getRouteFeeRange(swaps: Swap[]): [number, number] | undefined {
    const hasDynFee = swaps.filter((s: Swap) => s.tradeFeeRange).length > 0;
    if (hasDynFee) {
      const min = swaps
        .map((s: Swap) => s.tradeFeeRange?.[0] ?? s.tradeFeePct)
        .reduce((a: number, b: number) => a + b);
      const max = swaps
        .map((s: Swap) => s.tradeFeeRange?.[1] ?? s.tradeFeePct)
        .reduce((a: number, b: number) => a + b);
      return [min, max];
    }
  }

  /**
   * Pool fee range [min,max] in case pool is using dynamic fees
   *
   * @param {PoolFees} fees - pool fees
   * @returns min & max fee range if swapping through the pool with
   * dynamic fees support
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
   * Calculate and return best possible sell trade for assetIn>assetOut
   *
   * @param {number} assetIn - assetIn id
   * @param {number} assetOut - assetOut id
   * @param {bigint} amountIn - amount of assetIn to sell for assetOut
   * @returns best possible sell trade of given token pair
   */
  async getBestSell(
    assetIn: number,
    assetOut: number,
    amountIn: bigint | string
  ): Promise<Trade> {
    return this.getSell(assetIn, assetOut, amountIn);
  }

  /**
   * Calculate and return sell spot price for assetIn > assetOut
   *
   * @param route - sell route
   * @param spotDecimals - decimals to use for spot price calculation
   * @returns sell spot price
   */
  private getSellSpot(route: SellSwap[], spotDecimals: number): bigint {
    const lastSwap = route[route.length - 1];

    if (route.length === 1) {
      return lastSwap.spotPrice;
    }

    const cumulativeRouteDecimals = route
      .map((s: SellSwap) => s.assetOutDecimals)
      .reduce((a: number, b: number) => a + b);
    const cumulativeSpotPrice = route
      .map((s: SellSwap) => s.spotPrice)
      .reduce((a: bigint, b: bigint) => a * b);

    const spotAdjDecimals = cumulativeRouteDecimals - spotDecimals;
    const spotScalingFactor = BigInt(10) ** BigInt(spotAdjDecimals);

    return cumulativeSpotPrice / spotScalingFactor;
  }

  /**
   * Calculate and return sell trade for assetIn > assetOut pair
   *
   * @param {number} assetIn - asset in
   * @param {number} assetOut - asset out
   * @param {bigint | string} amountIn - amount of assetIn to sell for assetOut
   * @param {Hop[]} route - explicit route to use for trade
   * @returns sell trade breakdown of given asset pair
   */
  async getSell(
    assetIn: number,
    assetOut: number,
    amountIn: bigint | string,
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
   * Calculate and return all possible sells for assetIn > assetOut
   *
   * @param {number} assetIn - asset in
   * @param {number} assetOut - asset out
   * @param {bigint | string} amountIn - amount of assetIn to sell for assetOut
   * @returns possible sell trades of given asset pair
   */
  async getSells(
    assetIn: number,
    assetOut: number,
    amountIn: bigint | string
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
          return a.amountOut > b.amountOut ? -1 : 1;
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

    const spotPrice = this.getSellSpot(route, lastSwap.assetOutDecimals);

    const deltaY = lastSwap.amountOut;
    const delta0Y = isDirect
      ? lastSwap.calculatedOut
      : this.calculateDelta0Y(firstSwap.amountIn, route, poolsMap);

    const tradeFee = delta0Y - deltaY;
    const tradeFeeRange = this.getRouteFeeRange(route);
    const tradeFeePct = isDirect
      ? lastSwap.tradeFeePct
      : math.calculateSellFee(delta0Y, deltaY);

    const swapScalingFactor = Math.pow(10, firstSwap.assetInDecimals);
    const swapAmount =
      (firstSwap.amountIn * spotPrice) / BigInt(swapScalingFactor);

    const priceImpactPct = math.calculateDiffToRef(delta0Y, swapAmount);

    return {
      type: TradeType.Sell,
      amountIn: firstSwap.amountIn,
      amountOut: lastSwap.amountOut,
      spotPrice: spotPrice,
      tradeFee: tradeFee,
      tradeFeePct: tradeFeePct,
      tradeFeeRange: tradeFeeRange,
      priceImpactPct: priceImpactPct,
      swaps: route,
      toHuman() {
        return {
          type: TradeType.Sell,
          amountIn: big.toDecimal(
            firstSwap.amountIn,
            firstSwap.assetInDecimals
          ),
          amountOut: big.toDecimal(
            lastSwap.amountOut,
            lastSwap.assetOutDecimals
          ),
          spotPrice: big.toDecimal(spotPrice, lastSwap.assetOutDecimals),
          tradeFee: big.toDecimal(tradeFee, lastSwap.assetOutDecimals),
          tradeFeePct: tradeFeePct,
          tradeFeeRange: tradeFeeRange,
          priceImpactPct: priceImpactPct,
          swaps: route.map((s: SellSwap) => s.toHuman()),
        };
      },
    } as Trade;
  }

  /**
   * Calculate the amount out for best possible trade if fees are zero
   *
   * @param amountIn - amount of assetIn to sell for assetOut
   * @param route - best possible trade route (sell)
   * @param poolsMap - pools map
   * @returns the amount out for best possible trade if fees are zero
   */
  private calculateDelta0Y(
    amountIn: bigint,
    route: SellSwap[],
    poolsMap: Map<string, Pool>
  ) {
    const amounts: bigint[] = [];
    for (let i = 0; i < route.length; i++) {
      const swap = route[i];
      const pool = poolsMap.get(swap.poolAddress);
      if (pool == null) throw new Error('Pool does not exit');
      const poolPair = pool.parsePair(swap.assetIn, swap.assetOut);
      let aIn: bigint;
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
   * @param {number} assetIn - asset in
   * @param {number} assetOut - asset out
   * @param {Ctx} ctx - route ctx
   * @return most liquid route of given asset pair
   */
  private async calculateMostLiquidRoute(
    assetIn: number,
    assetOut: number,
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
        return t.map((t) => t.balance).reduce((a, b) => a + b);
      })
      .sort((a, b) => (b < a ? -1 : 1));

    const liquidity = assetInLiquidityDesc[0];
    const liquidityIn = math.getFraction(liquidity, 0.1);

    const routes = await Promise.all(
      paths.map((path) => this.toSellSwaps(liquidityIn, path, poolsMap))
    );
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
   * Calculate and return sell swaps for given path
   * - final amount of previous swap is entry to next one
   *
   * @param amountIn - amount of assetIn to sell for assetOut
   * @param path - current path
   * @param poolsMap - pools map
   * @returns sell swaps for given path
   */
  private async toSellSwaps(
    amountIn: bigint | string,
    path: Hop[],
    poolsMap: Map<string, Pool>
  ): Promise<SellSwap[]> {
    const swaps: SellSwap[] = [];
    for (let i = 0; i < path.length; i++) {
      const hop = path[i];
      const pool = poolsMap.get(hop.poolAddress);
      if (pool == null) throw new Error('Pool does not exit');

      const poolPair = pool.parsePair(hop.assetIn, hop.assetOut);

      let aIn: bigint;
      if (i > 0) {
        aIn = swaps[i - 1].amountOut;
      } else {
        aIn =
          typeof amountIn === 'string'
            ? big.toBigInt(amountIn, poolPair.decimalsIn)
            : amountIn;
      }

      const poolFees = await this.ctx.getPoolFees(poolPair, pool);
      const { amountOut, calculatedOut, feePct, errors } = pool.validateAndSell(
        poolPair,
        aIn,
        poolFees
      );
      const feePctRange = this.getPoolFeeRange(poolFees);
      const spotPrice = pool.spotPriceOutGivenIn(poolPair);

      const swapScalingFactor = Math.pow(10, poolPair.decimalsIn);
      const swapAmount = (aIn * spotPrice) / BigInt(swapScalingFactor);

      const priceImpactPct = math.calculateDiffToRef(calculatedOut, swapAmount);

      swaps.push({
        ...hop,
        assetInDecimals: poolPair.decimalsIn,
        assetOutDecimals: poolPair.decimalsOut,
        amountIn: aIn,
        amountOut: amountOut,
        calculatedOut: calculatedOut,
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
            amountIn: big.toDecimal(aIn, poolPair.decimalsIn),
            amountOut: big.toDecimal(amountOut, poolPair.decimalsOut),
            calculatedOut: big.toDecimal(calculatedOut, poolPair.decimalsOut),
            spotPrice: big.toDecimal(spotPrice, poolPair.decimalsOut),
            tradeFeePct: feePct,
            tradeFeeRange: feePctRange,
            priceImpactPct: priceImpactPct,
            errors: errors,
          };
        },
      } as SellSwap);
    }
    return swaps;
  }

  /**
   * Returns the most liquid route
   *
   * @param {number} assetIn - asset in
   * @param {number} assetOut - asset out
   * @return most liquid route of given asset pair
   */
  async getMostLiquidRoute(assetIn: number, assetOut: number): Promise<Hop[]> {
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
   * @param {number} assetIn - asset in
   * @param {number} assetOut - asset out
   * @return spot price of given asset pair, or undefined if trade not supported
   */
  async getSpotPrice(
    assetIn: number,
    assetOut: number
  ): Promise<Amount | undefined> {
    return this.withCtx(assetIn, assetOut, async (ctx) => {
      const { pools, poolsMap } = ctx;

      const routeKey = this.buildRouteKey(assetIn, assetOut, pools);
      let route = this.mlr.get(routeKey);
      if (!route) {
        route = await this.calculateMostLiquidRoute(assetIn, assetOut, ctx);
      }

      const swaps = await this.toSellSwaps('1', route, poolsMap);
      const spotPriceDecimals =
        swaps.length > 1
          ? Math.max(...swaps.map((s) => s.assetOutDecimals))
          : swaps[swaps.length - 1].assetOutDecimals;
      const spotPrice = this.getSellSpot(swaps, spotPriceDecimals);
      return { amount: spotPrice, decimals: spotPriceDecimals };
    }).catch(() => undefined);
  }

  /**
   * Find best buy route
   *
   * @param swaps - buy routes
   * @returns the most beneficial route without errors, if exist
   */
  private findBestBuyRoute(swaps: BuySwap[][]): BuySwap[] {
    const sortedResults = swaps.sort((a, b) => {
      const swapAFinal = a[0].amountIn;
      const swapBFinal = b[0].amountIn;
      return swapAFinal > swapBFinal ? 1 : -1;
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
   * @param {number} assetIn - asset in
   * @param {number} assetOut - asset out
   * @param {bigint | string} amountOut - amount of assetOut to buy for assetIn
   * @returns best possible buy trade of given asset pair
   */
  async getBestBuy(
    assetIn: number,
    assetOut: number,
    amountOut: bigint | string
  ): Promise<Trade> {
    return this.getBuy(assetIn, assetOut, amountOut);
  }

  /**
   * Calculate and return buy spot price for assetIn > assetOut
   *
   * @param route - buy route
   * @param spotDecimals - decimals to use for spot price calculation
   * @returns buy spot price
   */
  private getBuySpot(route: BuySwap[], spotDecimals: number): bigint {
    const lastSwap = route[0];

    if (route.length === 1) {
      return lastSwap.spotPrice;
    }

    const cumulativeRouteDecimals = route
      .map((s: BuySwap) => s.assetInDecimals)
      .reduce((a: number, b: number) => a + b);
    const cumulativeSpotPrice = route
      .map((s: BuySwap) => s.spotPrice)
      .reduce((a: bigint, b: bigint) => a * b);

    const spotAdjDecimals = cumulativeRouteDecimals - spotDecimals;
    const spotScalingFactor = BigInt(10) ** BigInt(spotAdjDecimals);
    return cumulativeSpotPrice / spotScalingFactor;
  }

  /**
   * Calculate and return buy trade for assetIn > assetOut pair
   *
   * @param {number} assetIn - asset in
   * @param {number} assetOut - asset out
   * @param {bigint | string} amountOut - amount of assetOut to buy for assetIn
   * @param {Hop[]} route - explicit route to use for trade
   * @returns buy trade breakdown of given asset pair
   */
  async getBuy(
    assetIn: number,
    assetOut: number,
    amountOut: bigint | string,
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
   * @param {number} assetIn - asset in
   * @param {number} assetOut - asset out
   * @param {bigint | string} amountOut - amount of assetOut to buy for assetIn
   * @returns possible buy trades of given asset pair
   */
  async getBuys(
    assetIn: number,
    assetOut: number,
    amountOut: bigint | string
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
          return a.amountIn > b.amountIn ? 1 : -1;
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

    const spotPrice = this.getBuySpot(route, lastSwap.assetInDecimals);

    const deltaX = lastSwap.amountIn;
    const delta0X = isDirect
      ? lastSwap.calculatedIn
      : this.calculateDelta0X(firstSwap.amountOut, route, poolsMap);

    const tradeFee = deltaX - delta0X;
    const tradeFeeRange = this.getRouteFeeRange(route);
    const tradeFeePct = isDirect
      ? lastSwap.tradeFeePct
      : math.calculateBuyFee(delta0X, deltaX);

    const swapScalingFactor = Math.pow(10, firstSwap.assetOutDecimals);
    const swapAmount =
      (firstSwap.amountOut * spotPrice) / BigInt(swapScalingFactor);

    let priceImpactPct: number;
    if (delta0X === 0n) {
      priceImpactPct = -100;
    } else {
      priceImpactPct = math.calculateDiffToRef(swapAmount, delta0X);
    }

    return {
      type: TradeType.Buy,
      amountOut: firstSwap.amountOut,
      amountIn: lastSwap.amountIn,
      spotPrice: spotPrice,
      tradeFee: tradeFee,
      tradeFeePct: tradeFeePct,
      tradeFeeRange: tradeFeeRange,
      priceImpactPct: priceImpactPct,
      swaps: route,
      toHuman() {
        return {
          type: TradeType.Buy,
          amountOut: big.toDecimal(
            firstSwap.amountOut,
            firstSwap.assetOutDecimals
          ),
          amountIn: big.toDecimal(lastSwap.amountIn, lastSwap.assetInDecimals),
          spotPrice: big.toDecimal(spotPrice, lastSwap.assetInDecimals),
          tradeFee: big.toDecimal(tradeFee, lastSwap.assetInDecimals),
          tradeFeePct: tradeFeePct,
          tradeFeeRange: tradeFeeRange,
          priceImpactPct: priceImpactPct,
          swaps: route.map((s: BuySwap) => s.toHuman()),
        };
      },
    } as Trade;
  }

  /**
   * Calculate the amount in for best possible trade if fees are zero
   *
   * @param amountOut - amount of assetOut to buy for assetIn
   * @param bestRoute - best possible trade route (buy)
   * @param poolsMap - pools map
   * @returns the amount in for best possible trade if fees are zero
   */
  private calculateDelta0X(
    amountOut: bigint,
    bestRoute: BuySwap[],
    poolsMap: Map<string, Pool>
  ) {
    const amounts: bigint[] = [];
    for (let i = bestRoute.length - 1; i >= 0; i--) {
      const swap = bestRoute[i];
      const pool = poolsMap.get(swap.poolAddress);
      if (pool == null) throw new Error('Pool does not exit');
      const poolPair = pool.parsePair(swap.assetIn, swap.assetOut);
      let aOut: bigint;
      if (i == bestRoute.length - 1) {
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
   * Calculate and return buy swaps for given path
   * - final amount of previous swap is entry to next one
   * - calculation is done backwards (swaps in reversed order)
   *
   * @param amountOut - amount of assetOut to buy for assetIn
   * @param path - current path
   * @param poolsMap - pools map
   * @returns buy swaps for given path
   */
  private async toBuySwaps(
    amountOut: bigint | string,
    path: Hop[],
    poolsMap: Map<string, Pool>
  ): Promise<BuySwap[]> {
    const swaps: BuySwap[] = [];
    for (let i = path.length - 1; i >= 0; i--) {
      const hop = path[i];
      const pool = poolsMap.get(hop.poolAddress);
      if (pool == null) throw new Error('Pool does not exit');

      const poolPair = pool.parsePair(hop.assetIn, hop.assetOut);

      let aOut: bigint;
      if (i == path.length - 1) {
        aOut =
          typeof amountOut === 'string'
            ? big.toBigInt(amountOut, poolPair.decimalsOut)
            : amountOut;
      } else {
        aOut = swaps[0].amountIn;
      }

      const poolFees = await this.ctx.getPoolFees(poolPair, pool);
      const { amountIn, calculatedIn, feePct, errors } = pool.validateAndBuy(
        poolPair,
        aOut,
        poolFees
      );
      const feePctRange = this.getPoolFeeRange(poolFees);
      const spotPrice = pool.spotPriceInGivenOut(poolPair);

      const swapScalingFactor = Math.pow(10, poolPair.decimalsOut);
      const swapAmount = (aOut * spotPrice) / BigInt(swapScalingFactor);

      let priceImpactPct: number;
      if (calculatedIn === 0n) {
        priceImpactPct = -100;
      } else {
        priceImpactPct = math.calculateDiffToRef(swapAmount, calculatedIn);
      }

      swaps.unshift({
        ...hop,
        assetInDecimals: poolPair.decimalsIn,
        assetOutDecimals: poolPair.decimalsOut,
        amountOut: aOut,
        amountIn: amountIn,
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
            amountOut: big.toDecimal(aOut, poolPair.decimalsOut),
            amountIn: big.toDecimal(amountIn, poolPair.decimalsIn),
            calculatedIn: big.toDecimal(calculatedIn, poolPair.decimalsIn),
            spotPrice: big.toDecimal(spotPrice, poolPair.decimalsIn),
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
