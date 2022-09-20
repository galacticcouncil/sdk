import { Router } from './router';
import { Hop, Pool, SellSwap, BuySwap, Trade, TradeType, Amount } from '../types';
import { BigNumber, bnum, scale } from '../utils/bignumber';
import { calculatePriceImpact, formatAmount } from '../utils/math';

export class TradeRouter extends Router {
  /**
   * Calculate and return best possible spot price for tokenIn>tokenOut
   *
   * @param {string} tokenIn - Storage key of tokenIn
   * @param {string} tokenOut - Storage key of tokenOut
   * @return Best possible spot price of given token pair
   */
  async getBestSpotPrice(tokenIn: string, tokenOut: string): Promise<Amount> {
    const pools = await super.getPools();
    if (pools.length === 0) throw new Error('No pools configured');
    const { poolsMap } = await super.validateTokenPair(tokenIn, tokenOut, pools);
    const paths = super.getPaths(tokenIn, tokenOut, poolsMap, pools);
    const spotPriceList = paths.map((path) => this.getSpotPrice(path, poolsMap));
    return spotPriceList.sort((a, b) => {
      const spA = a.amount;
      const spB = b.amount;
      return spA.isGreaterThan(spB) ? -1 : 1;
    })[0];
  }

  /**
   * Calculate and return spot price for given path
   *
   * @param path - current path
   * @param poolsMap - pools map
   * @returns Spot price for given path
   */
  private getSpotPrice(path: Hop[], poolsMap: Map<string, Pool>): Amount {
    const sPrices: Amount[] = [];
    for (let i = 0; i < path.length; i++) {
      const hop = path[i];
      const pool = poolsMap.get(hop.poolId);
      if (pool == null) throw new Error('Pool does not exit');

      const poolPair = pool.parsePoolPair(hop.tokenIn, hop.tokenOut);
      const spotPrice = pool.getSpotPriceOut(poolPair);

      sPrices.push({ amount: spotPrice, decimals: poolPair.decimalsOut } as Amount);
    }

    const spotPrice = sPrices
      .map((a: Amount) => a.amount.shiftedBy(-1 * a.decimals))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b));
    const spotPriceDecimals = sPrices[sPrices.length - 1].decimals;
    return { amount: scale(spotPrice, spotPriceDecimals).decimalPlaces(0, 1), decimals: spotPriceDecimals };
  }

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
      const swapAFinal = a[a.length - 1].amountOut;
      const swapBFinal = b[b.length - 1].amountOut;
      return swapAFinal.isGreaterThan(swapBFinal) ? -1 : 1;
    })[0];

    const firstRoute = bestRoute[0];
    const lastRoute = bestRoute[bestRoute.length - 1];

    const spotPrice = bestRoute
      .map((s: SellSwap) => s.spotPrice.shiftedBy(-1 * s.tokenOutDecimals))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b));

    const bestRouteSpotPrice = scale(spotPrice, lastRoute.tokenOutDecimals).decimalPlaces(0, 1);
    const bestRoutePriceImpact = calculatePriceImpact(
      firstRoute.amountIn,
      firstRoute.tokenInDecimals,
      bestRouteSpotPrice,
      lastRoute.calculatedOut
    );

    return {
      type: TradeType.Sell,
      amountIn: firstRoute.amountIn,
      amountOut: lastRoute.amountOut,
      spotPrice: bestRouteSpotPrice,
      priceImpactPct: bestRoutePriceImpact,
      swaps: bestRoute,
      toHuman() {
        return {
          type: TradeType.Sell,
          amountIn: formatAmount(firstRoute.amountIn, firstRoute.tokenInDecimals),
          amountOut: formatAmount(lastRoute.amountOut, lastRoute.tokenOutDecimals),
          spotPrice: formatAmount(bestRouteSpotPrice, lastRoute.tokenOutDecimals),
          priceImpactPct: bestRoutePriceImpact.toString(),
          swaps: bestRoute.map((s: SellSwap) => s.toHuman()),
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
  private toSellSwaps(amountIn: BigNumber | string | number, path: Hop[], poolsMap: Map<string, Pool>): SellSwap[] {
    const swaps: SellSwap[] = [];
    for (let i = 0; i < path.length; i++) {
      const hop = path[i];
      const pool = poolsMap.get(hop.poolId);
      if (pool == null) throw new Error('Pool does not exit');

      const poolPair = pool.parsePoolPair(hop.tokenIn, hop.tokenOut);

      let aIn: BigNumber;
      if (i > 0) {
        aIn = swaps[i - 1].amountOut;
      } else {
        aIn = scale(bnum(amountIn), poolPair.decimalsIn);
      }

      const calculated = pool.calculateOutGivenIn(poolPair, aIn);
      const fee = pool.calculateTradeFee(calculated);
      const final = calculated.minus(fee);
      const spotPrice = pool.getSpotPriceOut(poolPair);
      const priceImpact = calculatePriceImpact(aIn, poolPair.decimalsIn, spotPrice, calculated);

      swaps.push({
        ...hop,
        tokenInDecimals: poolPair.decimalsIn,
        tokenOutDecimals: poolPair.decimalsOut,
        amountIn: aIn,
        calculatedOut: calculated,
        amountOut: final,
        tradeFee: fee,
        spotPrice: spotPrice,
        priceImpactPct: priceImpact,
        toHuman() {
          return {
            ...hop,
            amountIn: formatAmount(aIn, poolPair.decimalsIn),
            calculatedOut: formatAmount(calculated, poolPair.decimalsOut),
            amountOut: formatAmount(final, poolPair.decimalsOut),
            tradeFee: formatAmount(fee, poolPair.decimalsOut),
            spotPrice: formatAmount(spotPrice, poolPair.decimalsOut),
            priceImpactPct: priceImpact.toString(),
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
  async getBestBuy(tokenIn: string, tokenOut: string, amountOut: BigNumber | string | number): Promise<Trade> {
    const pools = await super.getPools();
    if (pools.length === 0) throw new Error('No pools configured');
    const { poolsMap } = await super.validateTokenPair(tokenIn, tokenOut, pools);
    const paths = super.getPaths(tokenIn, tokenOut, poolsMap, pools);
    const swaps = paths.map((path) => this.toBuySwaps(amountOut, path, poolsMap));

    const bestRoute = swaps.sort((a, b) => {
      const swapAFinal = a[a.length - 1].amountIn;
      const swapBFinal = b[b.length - 1].amountIn;
      return swapAFinal.isGreaterThan(swapBFinal) ? 1 : -1;
    })[0];

    const firstRoute = bestRoute[0];
    const lastRoute = bestRoute[bestRoute.length - 1];

    const spotPrice = bestRoute
      .map((s: BuySwap) => s.spotPrice.shiftedBy(-1 * s.tokenInDecimals))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b));

    const bestRouteSpotPrice = scale(spotPrice, firstRoute.tokenInDecimals).decimalPlaces(0, 1);
    const bestRoutePriceImpact = calculatePriceImpact(
      firstRoute.amountOut,
      firstRoute.tokenOutDecimals,
      bestRouteSpotPrice,
      lastRoute.calculatedIn
    );

    return {
      type: TradeType.Buy,
      amountOut: firstRoute.amountOut,
      amountIn: lastRoute.amountIn,
      spotPrice: bestRouteSpotPrice,
      priceImpactPct: bestRoutePriceImpact,
      swaps: bestRoute,
      toHuman() {
        return {
          type: TradeType.Buy,
          amountOut: formatAmount(firstRoute.amountOut, lastRoute.tokenOutDecimals),
          amountIn: formatAmount(lastRoute.amountIn, firstRoute.tokenInDecimals),
          spotPrice: formatAmount(bestRouteSpotPrice, firstRoute.tokenInDecimals),
          priceImpactPct: bestRoutePriceImpact.toString(),
          swaps: bestRoute.map((s: BuySwap) => s.toHuman()),
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
        aOut = swaps[swaps.length - 1].amountIn;
      }

      const calculated = pool.calculateInGivenOut(poolPair, aOut);
      const fee = pool.calculateTradeFee(calculated);
      const final = calculated.plus(fee);
      const spotPrice = pool.getSpotPriceIn(poolPair);
      const priceImpact = calculatePriceImpact(aOut, poolPair.decimalsOut, spotPrice, calculated);

      swaps.push({
        ...hop,
        tokenInDecimals: poolPair.decimalsIn,
        tokenOutDecimals: poolPair.decimalsOut,
        amountOut: aOut,
        calculatedIn: calculated,
        amountIn: final,
        tradeFee: fee,
        spotPrice: spotPrice,
        priceImpactPct: priceImpact,
        toHuman() {
          return {
            ...hop,
            amountOut: formatAmount(aOut, poolPair.decimalsOut),
            calculatedIn: formatAmount(calculated, poolPair.decimalsIn),
            amountIn: formatAmount(final, poolPair.decimalsIn),
            tradeFee: formatAmount(fee, poolPair.decimalsIn),
            spotPrice: formatAmount(spotPrice, poolPair.decimalsIn),
            priceImpactPct: priceImpact.toString(),
          };
        },
      } as BuySwap);
    }
    return swaps;
  }
}
