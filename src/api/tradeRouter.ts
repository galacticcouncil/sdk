import { Router } from './router';
import { Hop, Pool, Swap, Trade } from '../types';
import { BigNumber, bnum, scale } from '../utils/bignumber';
import { calculateTradeFee, calculatePriceImpact, formatAmount } from '../utils/math';

export class TradeRouter extends Router {
  /**
   * Calculate and return best possible sell trade for tokenIn>tokenOut
   *
   * @param {string} tokenIn - Storage key of tokenIn
   * @param {string} tokenOut - Storage key of tokenOut
   * @param {BigNumber} amountIn - Amount of tokenIn to sell for tokenOut
   * @returns Best possible sell trade of given token pair
   */
  async getBestSell(tokenIn: string, tokenOut: string, amountIn: BigNumber | string | number): Promise<Trade> {
    const pools = await super.getPools();
    if (pools.length === 0) throw new Error('No pools configured');
    const { poolsMap } = await super.validateTokenPair(tokenIn, tokenOut, pools);
    const paths = super.getPaths(tokenIn, tokenOut, poolsMap, pools);
    const swaps = paths.map((path) => this.toSellSwaps(amountIn, path, poolsMap));
    const bestRoute = swaps.sort((a, b) => {
      const swapAFinal = a[a.length - 1].returnFinalAmount;
      const swapBFinal = b[b.length - 1].returnFinalAmount;
      return swapAFinal.isGreaterThan(swapBFinal) ? -1 : 1;
    })[0];

    const firstRoute = bestRoute[0];
    const lastRoute = bestRoute[bestRoute.length - 1];

    const bestRouteSpotPrice = bestRoute
      .map((s: Swap) => s.spotPrice.shiftedBy(-1 * s.tokenOutDecimals))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b));

    const bestRoutePriceImpact = bestRoute
      .map((s: Swap) => calculatePriceImpact(s.swapAmount, s.tokenInDecimals, s.spotPrice, s.returnAmount))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b))
      .decimalPlaces(2);

    const normalizedBestRouteSpotPrice = scale(bestRouteSpotPrice, lastRoute.tokenOutDecimals).decimalPlaces(0, 1);

    return {
      tradeAmount: firstRoute.swapAmount,
      returnAmount: lastRoute.returnFinalAmount,
      spotPrice: normalizedBestRouteSpotPrice,
      priceImpactPercentage: bestRoutePriceImpact,
      swaps: bestRoute,
      toHuman() {
        return {
          tradeAmount: formatAmount(firstRoute.swapAmount, firstRoute.tokenInDecimals),
          returnAmount: formatAmount(lastRoute.returnFinalAmount, lastRoute.tokenOutDecimals),
          spotPrice: formatAmount(normalizedBestRouteSpotPrice, lastRoute.tokenOutDecimals),
          priceImpactPercentage: bestRoutePriceImpact.toString(),
          swaps: bestRoute.map((s: Swap) => s.toHuman()),
        };
      },
    } as Trade;
  }

  /**
   * Calculate and return sell swaps for given path
   * - final amount of previous swap is entry to next one
   *
   * @param amountIn - Amount of tokenIn to sell for tokenOut
   * @param path - current path
   * @param poolsMap - pools map
   * @returns Sell swaps for given path with corresponding pool pairs
   */
  private toSellSwaps(amountIn: BigNumber | string | number, path: Hop[], poolsMap: Map<string, Pool>): Swap[] {
    const swaps: Swap[] = [];
    for (let i = 0; i < path.length; i++) {
      const hop = path[i];
      const pool = poolsMap.get(hop.poolId);
      if (pool == null) throw new Error('Pool does not exit');

      const poolPair = pool.parsePoolPair(hop.tokenIn, hop.tokenOut);

      let aIn: BigNumber;
      if (i > 0) {
        aIn = swaps[i - 1].returnFinalAmount;
      } else {
        aIn = scale(bnum(amountIn), poolPair.decimalsIn);
      }

      const calculated = pool.calculateOutGivenIn(poolPair, aIn);
      const fee = calculateTradeFee(calculated, poolPair.swapFee);
      const final = calculated.minus(fee);
      const spotPrice = pool.getSpotPriceOut(poolPair);
      const priceImpact = calculatePriceImpact(aIn, poolPair.decimalsIn, spotPrice, calculated);

      swaps.push({
        ...hop,
        tokenInDecimals: poolPair.decimalsIn,
        tokenOutDecimals: poolPair.decimalsOut,
        swapAmount: aIn,
        returnAmount: calculated,
        returnFinalAmount: final,
        swapFee: fee,
        spotPrice: spotPrice,
        priceImpactPercentage: priceImpact,
        toHuman() {
          return {
            ...hop,
            swapAmount: formatAmount(aIn, poolPair.decimalsIn),
            returnAmount: formatAmount(calculated, poolPair.decimalsOut),
            returnFinalAmount: formatAmount(final, poolPair.decimalsOut),
            swapFee: formatAmount(fee, poolPair.decimalsOut),
            spotPrice: formatAmount(spotPrice, poolPair.decimalsOut),
            priceImpactPercentage: priceImpact.toString(),
          };
        },
      } as Swap);
    }
    return swaps;
  }

  /**
   * Calculate and return best possible buy trade for tokenIn>tokenOut
   *
   * @param {string} tokenIn - Storage key of tokenIn
   * @param {string} tokenOut - Storage key of tokenOut
   * @param {BigNumber} amountOut - Amount of tokenOut to buy for tokenIn
   * @returns Best possible buy trade of given token pair
   */
  async getBestBuy(tokenIn: string, tokenOut: string, amountOut: BigNumber | string | number): Promise<Trade> {
    const pools = await super.getPools();
    if (pools.length === 0) throw new Error('No pools configured');
    const { poolsMap } = await super.validateTokenPair(tokenIn, tokenOut, pools);
    const paths = super.getPaths(tokenIn, tokenOut, poolsMap, pools);
    const swaps = paths.map((path) => this.toBuySwaps(amountOut, path, poolsMap));
    const bestRoute = swaps.sort((a, b) => {
      const swapAFinal = a[0].returnFinalAmount;
      const swapBFinal = b[0].returnFinalAmount;
      return swapAFinal.isGreaterThan(swapBFinal) ? 1 : -1;
    })[0];

    const firstRoute = bestRoute[0];
    const lastRoute = bestRoute[bestRoute.length - 1];

    const bestRouteSpotPrice = bestRoute
      .map((s: Swap) => s.spotPrice.shiftedBy(-1 * s.tokenInDecimals))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b));

    const bestRoutePriceImpact = bestRoute
      .map((s: Swap) => calculatePriceImpact(s.swapAmount, s.tokenOutDecimals, s.spotPrice, s.returnAmount))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b))
      .decimalPlaces(2);

    const normalizedBestRouteSpotPrice = scale(bestRouteSpotPrice, firstRoute.tokenInDecimals).decimalPlaces(0, 1);

    return {
      tradeAmount: lastRoute.swapAmount,
      returnAmount: firstRoute.returnFinalAmount,
      spotPrice: normalizedBestRouteSpotPrice,
      priceImpactPercentage: bestRoutePriceImpact,
      swaps: bestRoute,
      toHuman() {
        return {
          tradeAmount: formatAmount(lastRoute.swapAmount, lastRoute.tokenOutDecimals),
          returnAmount: formatAmount(firstRoute.returnFinalAmount, firstRoute.tokenInDecimals),
          spotPrice: formatAmount(normalizedBestRouteSpotPrice, firstRoute.tokenInDecimals),
          priceImpactPercentage: bestRoutePriceImpact.toString(),
          swaps: bestRoute.map((s: Swap) => s.toHuman()),
        };
      },
    } as Trade;
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
  private toBuySwaps(amountOut: BigNumber | string | number, path: Hop[], poolsMap: Map<string, Pool>): Swap[] {
    const swaps: Swap[] = [];
    for (let i = path.length - 1; i >= 0; i--) {
      const hop = path[i];
      const pool = poolsMap.get(hop.poolId);
      if (pool == null) throw new Error('Pool does not exit');

      const poolPair = pool.parsePoolPair(hop.tokenIn, hop.tokenOut);

      let aOut: BigNumber;
      if (i == path.length - 1) {
        aOut = scale(bnum(amountOut), poolPair.decimalsOut);
      } else {
        aOut = swaps[0].returnFinalAmount;
      }

      const calculated = pool.calculateInGivenOut(poolPair, aOut);
      const fee = calculateTradeFee(calculated, poolPair.swapFee);
      const final = calculated.plus(fee);
      const spotPrice = pool.getSpotPriceIn(poolPair);
      const priceImpact = calculatePriceImpact(aOut, poolPair.decimalsOut, spotPrice, calculated);

      swaps.unshift({
        ...hop,
        tokenInDecimals: poolPair.decimalsIn,
        tokenOutDecimals: poolPair.decimalsOut,
        swapAmount: aOut,
        returnAmount: calculated,
        returnFinalAmount: final,
        swapFee: fee,
        spotPrice: spotPrice,
        priceImpactPercentage: priceImpact,
        toHuman() {
          return {
            ...hop,
            swapAmount: formatAmount(aOut, poolPair.decimalsOut),
            returnAmount: formatAmount(calculated, poolPair.decimalsIn),
            returnFinalAmount: formatAmount(final, poolPair.decimalsIn),
            swapFee: formatAmount(fee, poolPair.decimalsIn),
            spotPrice: formatAmount(spotPrice, poolPair.decimalsIn),
            priceImpactPercentage: priceImpact.toString(),
          };
        },
      } as Swap);
    }
    return swaps;
  }
}
