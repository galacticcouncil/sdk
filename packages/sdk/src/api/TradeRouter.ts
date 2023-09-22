import { Router } from './Router';
import { Hop, Pool, PoolFees, SellSwap, BuySwap, Trade, TradeType, Amount, Transaction, Swap } from '../types';
import { BigNumber, bnum, scale } from '../utils/bignumber';
import { calculateSellFee, calculateBuyFee, calculateDiffToRef } from '../utils/math';
import { toHuman, toPct } from '../utils/mapper';
import { RouteNotFound } from '../errors';

export class TradeRouter extends Router {
  /**
   * Check whether trade is direct or not
   *
   * @param swaps - Trade route
   * @returns true if direct trade, otherwise false
   */
  private isDirectTrade(swaps: Swap[]) {
    return swaps.length == 1;
  }

  /**
   * Find best sell swap without errors, if there is none return first one found
   *
   * @param swaps - All possible sell routes
   * @returns best sell swap if exist, otherwise first one found
   */
  private findBestSellRoute(swaps: SellSwap[][]): SellSwap[] {
    const sortedResults = swaps.sort((a, b) => {
      const swapAFinal = a[a.length - 1].amountOut;
      const swapBFinal = b[b.length - 1].amountOut;
      return swapAFinal.isGreaterThan(swapBFinal) ? -1 : 1;
    });

    return (
      sortedResults.find((route: SellSwap[]) => route.every((swap: SellSwap) => swap.errors.length == 0)) ||
      sortedResults[0]
    );
  }

  /**
   * Return route fee range [min,max] in case pool is using dynamic fees
   *
   * @param swaps - Trade routes
   * @returns min & max fee range if swap through the pool with dynamic fees support
   */
  private getRouteFeeRange(swaps: Swap[]): [number, number] | undefined {
    const hasDynFee = swaps.filter((s: Swap) => s.tradeFeeRange).length > 0;
    if (hasDynFee) {
      const min = swaps.map((s: Swap) => s.tradeFeeRange?.[0] ?? s.tradeFeePct).reduce((a: number, b: number) => a + b);
      const max = swaps.map((s: Swap) => s.tradeFeeRange?.[1] ?? s.tradeFeePct).reduce((a: number, b: number) => a + b);
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
    const feeMin = fees.min ? toPct(fees.min) : undefined;
    const feeMax = fees.max ? toPct(fees.max) : undefined;
    if (feeMin && feeMax) {
      return [feeMin, feeMax];
    }
    return undefined;
  }

  /**
   * Calculate and return best possible sell trade for assetIn>assetOut
   *
   * @param {string} assetIn - Storage key of assetIn
   * @param {string} assetOut - Storage key of assetOut
   * @param {BigNumber} amountIn - Amount of assetIn to sell for assetOut
   * @returns Best possible sell trade of given token pair
   */
  async getBestSell(assetIn: string, assetOut: string, amountIn: BigNumber | string | number): Promise<Trade> {
    const pools = await super.getPools();
    if (pools.length === 0) throw new Error('No pools configured');
    const { poolsMap } = await super.validateTokenPair(assetIn, assetOut, pools);
    const paths = super.getPaths(assetIn, assetOut, poolsMap, pools);
    if (paths.length === 0) throw new RouteNotFound(assetIn, assetOut);

    const sellSwaps = paths.map(async (path) => await this.toSellSwaps(amountIn, path, poolsMap));
    const swaps = await Promise.all(sellSwaps);
    const bestRoute = this.findBestSellRoute(swaps);

    const firstSwap = bestRoute[0];
    const lastSwap = bestRoute[bestRoute.length - 1];
    const isDirect = this.isDirectTrade(bestRoute);

    const spotPrice = bestRoute
      .map((s: SellSwap) => s.spotPrice.shiftedBy(-1 * s.assetOutDecimals))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b));

    const bestRouteSpotPrice = scale(spotPrice, lastSwap.assetOutDecimals).decimalPlaces(0, 1);

    const swapAmount = firstSwap.amountIn.shiftedBy(-1 * firstSwap.assetInDecimals).multipliedBy(bestRouteSpotPrice);
    const bestRoutePriceImpact = calculateDiffToRef(lastSwap.calculatedOut, swapAmount);

    const delta0Y = isDirect ? lastSwap.calculatedOut : this.calculateDelta0Y(firstSwap.amountIn, bestRoute, poolsMap);
    const deltaY = lastSwap.amountOut;
    const tradeFeePct = isDirect ? lastSwap.tradeFeePct : calculateSellFee(delta0Y, deltaY).toNumber();
    const tradeFee = delta0Y.minus(deltaY);
    const tradeFeeRange = this.getRouteFeeRange(bestRoute);

    const sellTx = (minAmountOut: BigNumber): Transaction => {
      return this.poolService.buildSellTx(
        assetIn,
        assetOut,
        firstSwap.amountIn,
        minAmountOut,
        bestRoute.map((swap: SellSwap) => {
          return swap as Hop;
        })
      );
    };

    return {
      type: TradeType.Sell,
      amountIn: firstSwap.amountIn,
      amountOut: lastSwap.amountOut,
      spotPrice: bestRouteSpotPrice,
      tradeFee: tradeFee,
      tradeFeePct: tradeFeePct,
      tradeFeeRange: tradeFeeRange,
      priceImpactPct: bestRoutePriceImpact.toNumber(),
      swaps: bestRoute,
      toTx: sellTx,
      toHuman() {
        return {
          type: TradeType.Sell,
          amountIn: toHuman(firstSwap.amountIn, firstSwap.assetInDecimals),
          amountOut: toHuman(lastSwap.amountOut, lastSwap.assetOutDecimals),
          spotPrice: toHuman(bestRouteSpotPrice, lastSwap.assetOutDecimals),
          tradeFee: toHuman(tradeFee, lastSwap.assetOutDecimals),
          tradeFeePct: tradeFeePct,
          tradeFeeRange: tradeFeeRange,
          priceImpactPct: bestRoutePriceImpact.toNumber(),
          swaps: bestRoute.map((s: SellSwap) => s.toHuman()),
        };
      },
    } as Trade;
  }

  /**
   * Calculate the amount out for best possible trade if fees are zero
   *
   * @param amountIn - Amount of assetIn to sell for assetOut
   * @param bestRoute - Best possible trade route (sell)
   * @param poolsMap - Pools map
   * @returns the amount out for best possible trade if fees are zero
   */
  private calculateDelta0Y(amountIn: BigNumber, bestRoute: SellSwap[], poolsMap: Map<string, Pool>) {
    const amounts: BigNumber[] = [];
    for (let i = 0; i < bestRoute.length; i++) {
      const swap = bestRoute[i];
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
   * Calculate and return sell swaps for given path
   * - final amount of previous swap is entry to next one
   *
   * @param amountIn - Amount of assetIn to sell for assetOut
   * @param path - Current path
   * @param poolsMap - Pools map
   * @returns Sell swaps for given path with corresponding pool pairs
   */
  private async toSellSwaps(
    amountIn: BigNumber | string | number,
    path: Hop[],
    poolsMap: Map<string, Pool>
  ): Promise<SellSwap[]> {
    const swaps: SellSwap[] = [];
    for (let i = 0; i < path.length; i++) {
      const hop = path[i];
      const pool = poolsMap.get(hop.poolAddress);
      if (pool == null) throw new Error('Pool does not exit');

      const poolPair = pool.parsePair(hop.assetIn, hop.assetOut);

      let aIn: BigNumber;
      if (i > 0) {
        aIn = swaps[i - 1].amountOut;
      } else {
        aIn = scale(bnum(amountIn), poolPair.decimalsIn).decimalPlaces(0, 1);
      }

      const poolFees = await this.poolService.getPoolFees(poolPair.assetOut, pool);
      const { amountOut, calculatedOut, feePct, errors } = pool.validateAndSell(poolPair, aIn, poolFees);
      const feePctRange = this.getPoolFeeRange(poolFees);
      const spotPrice = pool.spotPriceOutGivenIn(poolPair);
      const swapAmount = aIn.shiftedBy(-1 * poolPair.decimalsIn).multipliedBy(spotPrice);
      const priceImpactPct = calculateDiffToRef(calculatedOut, swapAmount);

      swaps.push({
        ...hop,
        assetInDecimals: poolPair.decimalsIn,
        assetOutDecimals: poolPair.decimalsOut,
        amountIn: aIn,
        calculatedOut: calculatedOut,
        amountOut: amountOut,
        spotPrice: spotPrice,
        tradeFeePct: feePct,
        tradeFeeRange: feePctRange,
        priceImpactPct: priceImpactPct.toNumber(),
        errors: errors,
        toHuman() {
          return {
            ...hop,
            amountIn: toHuman(aIn, poolPair.decimalsIn),
            calculatedOut: toHuman(calculatedOut, poolPair.decimalsOut),
            amountOut: toHuman(amountOut, poolPair.decimalsOut),
            spotPrice: toHuman(spotPrice, poolPair.decimalsOut),
            tradeFeePct: feePct,
            tradeFeeRange: feePctRange,
            priceImpactPct: priceImpactPct.toNumber(),
            errors: errors,
          };
        },
      } as SellSwap);
    }
    return swaps;
  }

  /**
   * Calculate and return best possible spot price for tokenIn>tokenOut
   *
   * @param {string} assetIn - Storage key of tokenIn
   * @param {string} assetOut - Storage key of tokenOut
   * @return Best possible spot price of given token pair, or undefined if given pair trade not supported
   */
  async getBestSpotPrice(assetIn: string, assetOut: string): Promise<Amount | undefined> {
    const pools = await super.getPools();
    if (pools.length === 0) throw new Error('No pools configured');
    const { poolsMap } = await super.validateTokenPair(assetIn, assetOut, pools);
    const paths = super.getPaths(assetIn, assetOut, poolsMap, pools);

    if (paths.length === 0) {
      return Promise.resolve(undefined);
    }

    const sellSwaps = paths.map(async (path) => await this.toSellSwaps('1', path, poolsMap));
    const swaps = await Promise.all(sellSwaps);
    const bestRoute = this.findBestSellRoute(swaps);

    const spotPrice = bestRoute
      .map((s: SellSwap) => s.spotPrice.shiftedBy(-1 * s.assetOutDecimals))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b));

    const spotPriceDecimals = bestRoute[bestRoute.length - 1].assetOutDecimals;
    const spotPriceAmount = scale(spotPrice, spotPriceDecimals).decimalPlaces(0, 1);
    return { amount: spotPriceAmount, decimals: spotPriceDecimals };
  }

  /**
   * Find best buy swap without errors, if there is none return first one found
   *
   * @param swaps - All possible sell routes
   * @returns best sell swap if exist, otherwise first one found
   */
  private findBestBuyRoute(swaps: BuySwap[][]): BuySwap[] {
    const sortedResults = swaps.sort((a, b) => {
      const swapAFinal = a[0].amountIn;
      const swapBFinal = b[0].amountIn;
      return swapAFinal.isGreaterThan(swapBFinal) ? 1 : -1;
    });

    return (
      sortedResults.find((route: BuySwap[]) => route.every((swap: BuySwap) => swap.errors.length == 0)) ||
      sortedResults[0]
    );
  }

  /**
   * Calculate and return best possible buy trade for assetIn>assetOut
   *
   * @param {string} assetIn - Storage key of assetIn
   * @param {string} assetOut - Storage key of assetOut
   * @param {BigNumber} amountOut - Amount of tokenOut to buy for tokenIn
   * @returns Best possible buy trade of given token pair
   */
  async getBestBuy(assetIn: string, assetOut: string, amountOut: BigNumber | string | number): Promise<Trade> {
    const pools = await super.getPools();
    if (pools.length === 0) throw new Error('No pools configured');
    const { poolsMap } = await super.validateTokenPair(assetIn, assetOut, pools);
    const paths = super.getPaths(assetIn, assetOut, poolsMap, pools);
    if (paths.length === 0) throw new RouteNotFound(assetIn, assetOut);

    const buySwaps = paths.map(async (path) => await this.toBuySwaps(amountOut, path, poolsMap));
    const swaps = await Promise.all(buySwaps);
    const bestRoute = this.findBestBuyRoute(swaps);

    const firstSwap = bestRoute[bestRoute.length - 1];
    const lastSwap = bestRoute[0];
    const isDirect = this.isDirectTrade(bestRoute);

    const spotPrice = bestRoute
      .map((s: BuySwap) => s.spotPrice.shiftedBy(-1 * s.assetInDecimals))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b));

    const bestRouteSpotPrice = scale(spotPrice, lastSwap.assetInDecimals).decimalPlaces(0, 1);

    const swapAmount = firstSwap.amountOut.shiftedBy(-1 * firstSwap.assetOutDecimals).multipliedBy(bestRouteSpotPrice);
    let bestRoutePriceImpact: number;
    if (lastSwap.calculatedIn.isZero()) {
      bestRoutePriceImpact = -100;
    } else {
      bestRoutePriceImpact = calculateDiffToRef(swapAmount, lastSwap.calculatedIn).toNumber();
    }

    const delta0X = isDirect ? lastSwap.calculatedIn : this.calculateDelta0X(firstSwap.amountOut, bestRoute, poolsMap);
    const deltaX = lastSwap.amountIn;
    const tradeFeePct = isDirect ? lastSwap.tradeFeePct : calculateBuyFee(delta0X, deltaX);
    const tradeFee = deltaX.minus(delta0X);
    const tradeFeeRange = this.getRouteFeeRange(bestRoute);

    const buyTx = (maxAmountIn: BigNumber): Transaction => {
      return this.poolService.buildBuyTx(
        assetIn,
        assetOut,
        firstSwap.amountOut,
        maxAmountIn,
        bestRoute.map((swap: BuySwap) => {
          return swap as Hop;
        })
      );
    };

    return {
      type: TradeType.Buy,
      amountOut: firstSwap.amountOut,
      amountIn: lastSwap.amountIn,
      spotPrice: bestRouteSpotPrice,
      tradeFee: tradeFee,
      tradeFeePct: tradeFeePct,
      tradeFeeRange: tradeFeeRange,
      priceImpactPct: bestRoutePriceImpact,
      swaps: bestRoute,
      toTx: buyTx,
      toHuman() {
        return {
          type: TradeType.Buy,
          amountOut: toHuman(firstSwap.amountOut, firstSwap.assetOutDecimals),
          amountIn: toHuman(lastSwap.amountIn, lastSwap.assetInDecimals),
          spotPrice: toHuman(bestRouteSpotPrice, lastSwap.assetInDecimals),
          tradeFee: toHuman(tradeFee, lastSwap.assetInDecimals),
          tradeFeePct: tradeFeePct,
          tradeFeeRange: tradeFeeRange,
          priceImpactPct: bestRoutePriceImpact,
          swaps: bestRoute.map((s: BuySwap) => s.toHuman()),
        };
      },
    } as Trade;
  }

  /**
   * Calculate the amount in for best possible trade if fees are zero
   *
   * @param amountOut - Amount of assetOut to buy for assetIn
   * @param bestRoute - Best possible trade route (buy)
   * @param poolsMap - Pools map
   * @returns the amount in for best possible trade if fees are zero
   */
  private calculateDelta0X(amountOut: BigNumber, bestRoute: BuySwap[], poolsMap: Map<string, Pool>) {
    const amounts: BigNumber[] = [];
    for (let i = bestRoute.length - 1; i >= 0; i--) {
      const swap = bestRoute[i];
      const pool = poolsMap.get(swap.poolAddress);
      if (pool == null) throw new Error('Pool does not exit');
      const poolPair = pool.parsePair(swap.assetIn, swap.assetOut);
      let aOut: BigNumber;
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
   * @param amountOut - Amount of assetOut to buy for assetIn
   * @param path - Current path
   * @param poolsMap - Pools map
   * @returns Buy swaps for given path
   */
  private async toBuySwaps(
    amountOut: BigNumber | string | number,
    path: Hop[],
    poolsMap: Map<string, Pool>
  ): Promise<BuySwap[]> {
    const swaps: BuySwap[] = [];
    for (let i = path.length - 1; i >= 0; i--) {
      const hop = path[i];
      const pool = poolsMap.get(hop.poolAddress);
      if (pool == null) throw new Error('Pool does not exit');

      const poolPair = pool.parsePair(hop.assetIn, hop.assetOut);

      let aOut: BigNumber;
      if (i == path.length - 1) {
        aOut = scale(bnum(amountOut), poolPair.decimalsOut).decimalPlaces(0, 1);
      } else {
        aOut = swaps[0].amountIn;
      }

      const poolFees = await this.poolService.getPoolFees(poolPair.assetIn, pool);
      const { amountIn, calculatedIn, feePct, errors } = pool.validateAndBuy(poolPair, aOut, poolFees);
      const feePctRange = this.getPoolFeeRange(poolFees);
      const spotPrice = pool.spotPriceInGivenOut(poolPair);

      const swapAmount = aOut.shiftedBy(-1 * poolPair.decimalsOut).multipliedBy(spotPrice);
      let priceImpactPct: number;
      if (calculatedIn.isZero()) {
        priceImpactPct = -100;
      } else {
        priceImpactPct = calculateDiffToRef(swapAmount, calculatedIn).toNumber();
      }

      swaps.unshift({
        ...hop,
        assetInDecimals: poolPair.decimalsIn,
        assetOutDecimals: poolPair.decimalsOut,
        amountOut: aOut,
        calculatedIn: calculatedIn,
        amountIn: amountIn,
        spotPrice: spotPrice,
        tradeFeePct: feePct,
        tradeFeeRange: feePctRange,
        priceImpactPct: priceImpactPct,
        errors: errors,
        toHuman() {
          return {
            ...hop,
            amountOut: toHuman(aOut, poolPair.decimalsOut),
            calculatedIn: toHuman(calculatedIn, poolPair.decimalsIn),
            amountIn: toHuman(amountIn, poolPair.decimalsIn),
            spotPrice: toHuman(spotPrice, poolPair.decimalsIn),
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
