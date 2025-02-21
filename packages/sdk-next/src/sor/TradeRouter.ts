import { Router } from './Router';
import { BuySwap, SellSwap, Swap, Trade, TradeType } from './types';

import { SYSTEM_ASSET_DECIMALS } from '../consts';
import { RouteNotFound } from '../errors';
import { Hop, Pool, PoolFees, PoolToken } from '../pool';
import { Amount } from '../types';
import { big, fmt, math } from '../utils';

export class TradeRouter extends Router {
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
   * Find the best sell swap without errors
   *
   * @param {SellSwap[]} swaps - all possible sell routes
   * @returns best sell swap if exist, otherwise first one found
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
    const feeMin = fees.min ? fmt.toPct(fees.min) : undefined;
    const feeMax = fees.max ? fmt.toPct(fees.max) : undefined;
    if (feeMin && feeMax) {
      return [feeMin, feeMax];
    }
    return undefined;
  }

  /**
   * Calculate and return best possible sell trade for assetIn>assetOut
   *
   * @param {string} assetIn - assetIn id
   * @param {string} assetOut - assetOut id
   * @param {bigint} amountIn - amount of assetIn to sell for assetOut
   * @returns best possible sell trade of given token pair
   */
  async getBestSell(
    assetIn: number,
    assetOut: number,
    amountIn: bigint
  ): Promise<Trade> {
    return this.getSell(assetIn, assetOut, amountIn);
  }

  /**
   * Calculate and return sell spot price for assetIn>assetOut
   *
   * @param route - best possible trade route (sell)
   * @returns sell spot price
   */
  private async getSellSpot(route: SellSwap[]): Promise<bigint> {
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

    const spotAdjDecimals = cumulativeRouteDecimals - lastSwap.assetOutDecimals;
    const spotScalingFactor = Math.pow(10, spotAdjDecimals);
    return cumulativeSpotPrice / BigInt(spotScalingFactor);
  }

  /**
   * Calculate and return sell trade for assetIn>assetOut
   *
   * @param {string} assetIn - assetIn id
   * @param {string} assetOut - assetOut id
   * @param {bigint} amountIn - amount of assetIn to sell for assetOut
   * @param {Hop[]} route - explicit route to use for trade
   * @returns sell trade of given token pair
   */
  async getSell(
    assetIn: number,
    assetOut: number,
    amountIn: bigint,
    route?: Hop[]
  ): Promise<Trade> {
    const pools = await super.getPools();
    const poolsMap = super.validateInput(assetIn, assetOut, pools);

    const paths = super.getPaths(assetIn, assetOut, pools);
    if (paths.length === 0) throw new RouteNotFound(assetIn, assetOut);

    let swaps: SellSwap[];
    if (route) {
      swaps = await this.toSellSwaps(amountIn, route, poolsMap);
    } else {
      const routes = await Promise.all(
        paths.map((path) => this.toSellSwaps(amountIn, path, poolsMap))
      );
      swaps = this.findBestSellRoute(routes);
    }

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];
    const isDirect = this.isDirectTrade(swaps);

    const spotPrice = await this.getSellSpot(swaps);

    const deltaY = lastSwap.amountOut;
    const delta0Y = isDirect
      ? lastSwap.calculatedOut
      : this.calculateDelta0Y(firstSwap.amountIn, swaps, poolsMap);

    const tradeFee = delta0Y - deltaY;
    const tradeFeeRange = this.getRouteFeeRange(swaps);
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
      swaps: swaps,
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
          swaps: swaps.map((s: SellSwap) => s.toHuman()),
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
   * Calculate and return sell swaps for given path
   * - final amount of previous swap is entry to next one
   *
   * @param amountIn - amount of assetIn to sell for assetOut
   * @param path - current path
   * @param poolsMap - pools map
   * @returns sell swaps for given path
   */
  private async toSellSwaps(
    amountIn: bigint,
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
        aIn = amountIn;
      }

      const poolFees = await this.ctx.getPoolFees(pool, poolPair.assetOut);
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
   * Calculate and return spot price for tokenIn>tokenOut
   *
   * To avoid routing through the pools with low liquidity, 0.1% from the
   * most liquid pool asset is used as reference value to determine ideal
   * route to calculate spot.
   *
   * @param {number} assetIn - assetIn id
   * @param {number} assetOut - assetOut id
   * @return best possible spot price of given asset pair, or undefined
   * if given pair swap is not supported
   */
  async getSpotPrice(assetIn: number, assetOut: number): Promise<Amount> {
    const pools = await super.getPools();
    const poolsMap = super.validateInput(assetIn, assetOut, pools);
    const paths = super.getPaths(assetIn, assetOut, pools);

    const [mostLiquidAsset] = pools
      .map((pool) => pool.tokens.find((t) => t.id === assetIn))
      .filter((a): a is PoolToken => !!a)
      .sort((a, b) => Number(b.balance) - Number(a.balance));

    const { balance, decimals } = mostLiquidAsset;
    const liquidityIn = math.getFraction(balance, 0.1);

    const routes = await Promise.all(
      paths.map((path) => this.toSellSwaps(liquidityIn, path, poolsMap))
    );
    const route = this.findBestSellRoute(routes);

    const unit = Math.pow(10, decimals || SYSTEM_ASSET_DECIMALS);
    const swaps = await this.toSellSwaps(BigInt(unit), route, poolsMap);

    const spotPrice = await this.getSellSpot(swaps);
    const spotPriceDecimals = swaps[swaps.length - 1].assetOutDecimals;
    return { amount: spotPrice, decimals: spotPriceDecimals };
  }

  /**
   * Find the best buy swap without errors, if there is none return first one found
   *
   * @param {BuySwap[]} swaps - all possible buy routes
   * @returns best buy swap if exist, otherwise first one found
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
   * Calculate and return best possible buy trade for assetIn>assetOut
   *
   * @param {number} assetIn - assetIn id
   * @param {number} assetOut - assetOut id
   * @param {bigint} amountOut - amount of tokenOut to buy for tokenIn
   * @returns best possible buy trade of given token pair
   */
  async getBestBuy(
    assetIn: number,
    assetOut: number,
    amountOut: bigint
  ): Promise<Trade> {
    return this.getBuy(assetIn, assetOut, amountOut);
  }

  /**
   * Calculate and return buy spot price for assetIn>assetOut
   *
   * @param route - best possible trade route (buy)
   * @returns buy spot price
   */
  private async getBuySpot(route: BuySwap[]): Promise<bigint> {
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

    const spotAdjDecimals = cumulativeRouteDecimals - lastSwap.assetInDecimals;
    const spotScalingFactor = Math.pow(10, spotAdjDecimals);
    return cumulativeSpotPrice / BigInt(spotScalingFactor);
  }

  /**
   * Calculate and return buy trade for assetIn>assetOut
   *
   * @param {number} assetIn - assetIn id
   * @param {number} assetOut - assetOut id
   * @param {bigint} amountOut - amount of tokenOut to buy for tokenIn
   * @param {Hop[]} route - explicit route to use for trade
   * @returns buy trade of given token pair
   */
  async getBuy(
    assetIn: number,
    assetOut: number,
    amountOut: bigint,
    route?: Hop[]
  ): Promise<Trade> {
    const pools = await super.getPools();
    const poolsMap = super.validateInput(assetIn, assetOut, pools);

    const paths = super.getPaths(assetIn, assetOut, pools);
    if (paths.length === 0) throw new RouteNotFound(assetIn, assetOut);

    let swaps: BuySwap[];
    if (route) {
      swaps = await this.toBuySwaps(amountOut, route, poolsMap);
    } else {
      const routes = await Promise.all(
        paths.map((path) => this.toBuySwaps(amountOut, path, poolsMap))
      );
      swaps = this.findBestBuyRoute(routes);
    }

    const firstSwap = swaps[swaps.length - 1];
    const lastSwap = swaps[0];
    const isDirect = this.isDirectTrade(swaps);

    const spotPrice = await this.getBuySpot(swaps);

    const deltaX = lastSwap.amountIn;
    const delta0X = isDirect
      ? lastSwap.calculatedIn
      : this.calculateDelta0X(firstSwap.amountOut, swaps, poolsMap);

    const tradeFee = deltaX - delta0X;
    const tradeFeeRange = this.getRouteFeeRange(swaps);
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
      swaps: swaps,
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
          swaps: swaps.map((s: BuySwap) => s.toHuman()),
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
    amountOut: bigint,
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
        aOut = amountOut;
      } else {
        aOut = swaps[0].amountIn;
      }

      const poolFees = await this.ctx.getPoolFees(pool, poolPair.assetOut);
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
