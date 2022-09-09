import { Router } from './router';
import { Hop, Pool, SellSwap, BuySwap, Sell, Buy } from '../types';
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
  async getBestSell(tokenIn: string, tokenOut: string, amountIn: BigNumber | string | number): Promise<Sell> {
    const pools = await super.getPools();
    if (pools.length === 0) throw new Error('No pools configured');
    const { poolsMap } = await super.validateTokenPair(tokenIn, tokenOut, pools);
    const paths = super.getPaths(tokenIn, tokenOut, poolsMap, pools);
    const swaps = paths.map((path) => this.toSellSwaps(amountIn, path, poolsMap));
    const bestRoute = swaps.sort((a, b) => {
      const swapAFinal = a[a.length - 1].finalAmount;
      const swapBFinal = b[b.length - 1].finalAmount;
      return swapAFinal.isGreaterThan(swapBFinal) ? -1 : 1;
    })[0];

    const firstRoute = bestRoute[0];
    const lastRoute = bestRoute[bestRoute.length - 1];

    const bestRouteSpotPrice = bestRoute
      .map((s: SellSwap) => s.spotPrice.shiftedBy(-1 * s.tokenOutDecimals))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b));

    const bestRoutePriceImpact = bestRoute
      .map((s: SellSwap) => calculatePriceImpact(s.amountIn, s.tokenInDecimals, s.spotPrice, s.calculatedOut))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b))
      .decimalPlaces(2);

    const normalizedBestRouteSpotPrice = scale(bestRouteSpotPrice, lastRoute.tokenOutDecimals).decimalPlaces(0, 1);

    return {
      amountIn: firstRoute.amountIn,
      finalAmount: lastRoute.finalAmount,
      spotPrice: normalizedBestRouteSpotPrice,
      priceImpactPercentage: bestRoutePriceImpact,
      swaps: bestRoute,
      toHuman() {
        return {
          amountIn: formatAmount(firstRoute.amountIn, firstRoute.tokenInDecimals),
          finalAmount: formatAmount(lastRoute.finalAmount, lastRoute.tokenOutDecimals),
          spotPrice: formatAmount(normalizedBestRouteSpotPrice, lastRoute.tokenOutDecimals),
          priceImpactPercentage: bestRoutePriceImpact.toString(),
          swaps: bestRoute.map((s: SellSwap) => s.toHuman()),
        };
      },
    } as Sell;
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
  private toSellSwaps(amountIn: BigNumber | string | number, path: Hop[], poolsMap: Map<string, Pool>): SellSwap[] {
    const swaps: SellSwap[] = [];
    for (let i = 0; i < path.length; i++) {
      const hop = path[i];
      const pool = poolsMap.get(hop.poolId);
      if (pool == null) throw new Error('Pool does not exit');

      const poolPair = pool.parsePoolPair(hop.tokenIn, hop.tokenOut);

      let aIn: BigNumber;
      if (i > 0) {
        aIn = swaps[i - 1].finalAmount;
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
        amountIn: aIn,
        calculatedOut: calculated,
        finalAmount: final,
        swapFee: fee,
        spotPrice: spotPrice,
        priceImpactPercentage: priceImpact,
        toHuman() {
          return {
            ...hop,
            amountIn: formatAmount(aIn, poolPair.decimalsIn),
            calculatedAmount: formatAmount(calculated, poolPair.decimalsOut),
            finalAmount: formatAmount(final, poolPair.decimalsOut),
            swapFee: formatAmount(fee, poolPair.decimalsOut),
            spotPrice: formatAmount(spotPrice, poolPair.decimalsOut),
            priceImpactPercentage: priceImpact.toString(),
          };
        },
      } as SellSwap);
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
  async getBestBuy(tokenIn: string, tokenOut: string, amountOut: BigNumber | string | number): Promise<Buy> {
    const pools = await super.getPools();
    if (pools.length === 0) throw new Error('No pools configured');
    const { poolsMap } = await super.validateTokenPair(tokenIn, tokenOut, pools);
    const paths = super.getPaths(tokenIn, tokenOut, poolsMap, pools);
    const swaps = paths.map((path) => this.toBuySwaps(amountOut, path, poolsMap));

    const bestRoute = swaps.sort((a, b) => {
      const swapAFinal = a[a.length - 1].finalAmount;
      const swapBFinal = b[b.length - 1].finalAmount;
      return swapAFinal.isGreaterThan(swapBFinal) ? 1 : -1;
    })[0];

    const firstRoute = bestRoute[0];
    const lastRoute = bestRoute[bestRoute.length - 1];

    const bestRouteSpotPrice = bestRoute
      .map((s: BuySwap) => s.spotPrice.shiftedBy(-1 * s.tokenInDecimals))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b));

    const bestRoutePriceImpact = bestRoute
      .map((s: BuySwap) => calculatePriceImpact(s.amountOut, s.tokenOutDecimals, s.spotPrice, s.calculatedIn))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b))
      .decimalPlaces(2);

    const normalizedBestRouteSpotPrice = scale(bestRouteSpotPrice, firstRoute.tokenInDecimals).decimalPlaces(0, 1);

    return {
      amountOut: firstRoute.amountOut,
      finalAmount: lastRoute.finalAmount,
      spotPrice: normalizedBestRouteSpotPrice,
      priceImpactPercentage: bestRoutePriceImpact,
      swaps: bestRoute,
      toHuman() {
        return {
          amountOut: formatAmount(firstRoute.amountOut, lastRoute.tokenOutDecimals),
          finalAmount: formatAmount(lastRoute.finalAmount, firstRoute.tokenInDecimals),
          spotPrice: formatAmount(normalizedBestRouteSpotPrice, firstRoute.tokenInDecimals),
          priceImpactPercentage: bestRoutePriceImpact.toString(),
          swaps: bestRoute.map((s: BuySwap) => s.toHuman()),
        };
      },
    } as Buy;
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
  private toBuySwaps(amountOut: BigNumber | string | number, path: Hop[], poolsMap: Map<string, Pool>): BuySwap[] {
    const swaps: BuySwap[] = [];
    for (let i = path.length - 1; i >= 0; i--) {
      const hop = path[i];
      const pool = poolsMap.get(hop.poolId);
      if (pool == null) throw new Error('Pool does not exit');

      const poolPair = pool.parsePoolPair(hop.tokenIn, hop.tokenOut);

      let aOut: BigNumber;
      if (i == path.length - 1) {
        aOut = scale(bnum(amountOut), poolPair.decimalsOut);
      } else {
        aOut = swaps[swaps.length - 1].finalAmount;
      }

      const calculated = pool.calculateInGivenOut(poolPair, aOut);
      const fee = calculateTradeFee(calculated, poolPair.swapFee);
      const final = calculated.plus(fee);
      const spotPrice = pool.getSpotPriceIn(poolPair);
      const priceImpact = calculatePriceImpact(aOut, poolPair.decimalsOut, spotPrice, calculated);

      swaps.push({
        ...hop,
        tokenInDecimals: poolPair.decimalsIn,
        tokenOutDecimals: poolPair.decimalsOut,
        amountOut: aOut,
        calculatedIn: calculated,
        finalAmount: final,
        swapFee: fee,
        spotPrice: spotPrice,
        priceImpactPercentage: priceImpact,
        toHuman() {
          return {
            ...hop,
            amountOut: formatAmount(aOut, poolPair.decimalsOut),
            calculatedIn: formatAmount(calculated, poolPair.decimalsIn),
            finalAmount: formatAmount(final, poolPair.decimalsIn),
            swapFee: formatAmount(fee, poolPair.decimalsIn),
            spotPrice: formatAmount(spotPrice, poolPair.decimalsIn),
            priceImpactPercentage: priceImpact.toString(),
          };
        },
      } as BuySwap);
    }
    return swaps;
  }
}
