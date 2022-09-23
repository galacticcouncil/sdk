import { Router } from './router';
import { Hop, Pool, SellSwap, BuySwap, Trade, TradeType, Amount } from '../types';
import { BigNumber, bnum, scale } from '../utils/bignumber';
import { calculatePriceImpact, formatAmount } from '../utils/math';

export class TradeRouter extends Router {
  /**
   * Calculate and return best possible spot price for tokenIn>tokenOut
   *
   * @param {string} assetIn - Storage key of tokenIn
   * @param {string} assetOut - Storage key of tokenOut
   * @return Best possible spot price of given token pair
   */
  async getBestSpotPrice(assetIn: string, assetOut: string): Promise<Amount> {
    const pools = await super.getPools();
    if (pools.length === 0) throw new Error('No pools configured');
    const { poolsMap } = await super.validateTokenPair(assetIn, assetOut, pools);
    const paths = super.getPaths(assetIn, assetOut, poolsMap, pools);
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

      const poolPair = pool.parsePoolPair(hop.assetIn, hop.assetOut);
      const spotPrice = pool.spotPriceOutGivenIn(poolPair);

      sPrices.push({ amount: spotPrice, decimals: poolPair.decimalsOut } as Amount);
    }

    const spotPrice = sPrices
      .map((a: Amount) => a.amount.shiftedBy(-1 * a.decimals))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b));
    const spotPriceDecimals = sPrices[sPrices.length - 1].decimals;
    return { amount: scale(spotPrice, spotPriceDecimals).decimalPlaces(0, 1), decimals: spotPriceDecimals };
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
    const swaps = paths.map((path) => this.toSellSwaps(amountIn, path, poolsMap));

    const bestRoute = swaps.sort((a, b) => {
      const swapAFinal = a[a.length - 1].amountOut;
      const swapBFinal = b[b.length - 1].amountOut;
      return swapAFinal.isGreaterThan(swapBFinal) ? -1 : 1;
    })[0];

    const firstRoute = bestRoute[0];
    const lastRoute = bestRoute[bestRoute.length - 1];

    const spotPrice = bestRoute
      .map((s: SellSwap) => s.spotPrice.shiftedBy(-1 * s.assetOutDecimals))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b));

    const bestRouteSpotPrice = scale(spotPrice, lastRoute.assetOutDecimals).decimalPlaces(0, 1);
    const bestRoutePriceImpact = calculatePriceImpact(
      firstRoute.amountIn,
      firstRoute.assetInDecimals,
      bestRouteSpotPrice,
      lastRoute.calculatedOut
    );

    const executeSell = (minAmountOut: BigNumber) => {
      this.poolService.sell(
        assetIn,
        assetOut,
        firstRoute.amountIn,
        minAmountOut,
        bestRoute.map((hop: Hop) => hop)
      );
    };

    return {
      type: TradeType.Sell,
      amountIn: firstRoute.amountIn,
      amountOut: lastRoute.amountOut,
      spotPrice: bestRouteSpotPrice,
      priceImpactPct: bestRoutePriceImpact,
      swaps: bestRoute,
      execute: executeSell,
      toHuman() {
        return {
          type: TradeType.Sell,
          amountIn: formatAmount(firstRoute.amountIn, firstRoute.assetInDecimals),
          amountOut: formatAmount(lastRoute.amountOut, lastRoute.assetOutDecimals),
          spotPrice: formatAmount(bestRouteSpotPrice, lastRoute.assetOutDecimals),
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
   * @param amountIn - Amount of assetIn to sell for assetOut
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

      const poolPair = pool.parsePoolPair(hop.assetIn, hop.assetOut);

      let aIn: BigNumber;
      if (i > 0) {
        aIn = swaps[i - 1].amountOut;
      } else {
        aIn = scale(bnum(amountIn), poolPair.decimalsIn);
      }

      const { amountOut, calculatedOut, fee } = pool.validateSell(poolPair, aIn);
      const spotPrice = pool.spotPriceOutGivenIn(poolPair);
      const priceImpact = calculatePriceImpact(aIn, poolPair.decimalsIn, spotPrice, calculatedOut);

      swaps.push({
        ...hop,
        assetInDecimals: poolPair.decimalsIn,
        assetOutDecimals: poolPair.decimalsOut,
        amountIn: aIn,
        calculatedOut: calculatedOut,
        amountOut: amountOut,
        spotPrice: spotPrice,
        tradeFeePct: fee,
        priceImpactPct: priceImpact,
        toHuman() {
          return {
            ...hop,
            amountIn: formatAmount(aIn, poolPair.decimalsIn),
            calculatedOut: formatAmount(calculatedOut, poolPair.decimalsOut),
            amountOut: formatAmount(amountOut, poolPair.decimalsOut),
            spotPrice: formatAmount(spotPrice, poolPair.decimalsOut),
            tradeFeePct: fee.toString(),
            priceImpactPct: priceImpact.toString(),
          };
        },
      } as SellSwap);
    }
    return swaps;
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
    const swaps = paths.map((path) => this.toBuySwaps(amountOut, path, poolsMap));

    const bestRoute = swaps.sort((a, b) => {
      const swapAFinal = a[a.length - 1].amountIn;
      const swapBFinal = b[b.length - 1].amountIn;
      return swapAFinal.isGreaterThan(swapBFinal) ? 1 : -1;
    })[0];

    const firstRoute = bestRoute[0];
    const lastRoute = bestRoute[bestRoute.length - 1];

    const spotPrice = bestRoute
      .map((s: BuySwap) => s.spotPrice.shiftedBy(-1 * s.assetInDecimals))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b));

    const bestRouteSpotPrice = scale(spotPrice, firstRoute.assetInDecimals).decimalPlaces(0, 1);
    const bestRoutePriceImpact = calculatePriceImpact(
      firstRoute.amountOut,
      firstRoute.assetOutDecimals,
      bestRouteSpotPrice,
      lastRoute.calculatedIn
    );

    const executeBuy = (maxAmountIn: BigNumber) => {
      this.poolService.buy(
        assetIn,
        assetOut,
        firstRoute.amountOut,
        maxAmountIn,
        bestRoute.map((hop: Hop) => hop)
      );
    };

    return {
      type: TradeType.Buy,
      amountOut: firstRoute.amountOut,
      amountIn: lastRoute.amountIn,
      spotPrice: bestRouteSpotPrice,
      priceImpactPct: bestRoutePriceImpact,
      swaps: bestRoute,
      execute: executeBuy,
      toHuman() {
        return {
          type: TradeType.Buy,
          amountOut: formatAmount(firstRoute.amountOut, lastRoute.assetOutDecimals),
          amountIn: formatAmount(lastRoute.amountIn, firstRoute.assetInDecimals),
          spotPrice: formatAmount(bestRouteSpotPrice, firstRoute.assetInDecimals),
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
   * @param amountOut - Amount of assetOut to buy for assetIn
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

      const poolPair = pool.parsePoolPair(hop.assetIn, hop.assetOut);

      let aOut: BigNumber;
      if (i == path.length - 1) {
        aOut = scale(bnum(amountOut), poolPair.decimalsOut);
      } else {
        aOut = swaps[swaps.length - 1].amountIn;
      }

      const { amountIn, calculatedIn, fee } = pool.validateBuy(poolPair, aOut);
      const spotPrice = pool.spotPriceInGivenOut(poolPair);
      const priceImpact = calculatePriceImpact(aOut, poolPair.decimalsOut, spotPrice, calculatedIn);

      swaps.push({
        ...hop,
        assetInDecimals: poolPair.decimalsIn,
        assetOutDecimals: poolPair.decimalsOut,
        amountOut: aOut,
        calculatedIn: calculatedIn,
        amountIn: amountIn,
        spotPrice: spotPrice,
        tradeFeePct: fee,
        priceImpactPct: priceImpact,
        toHuman() {
          return {
            ...hop,
            amountOut: formatAmount(aOut, poolPair.decimalsOut),
            calculatedIn: formatAmount(calculatedIn, poolPair.decimalsIn),
            amountIn: formatAmount(amountIn, poolPair.decimalsIn),
            spotPrice: formatAmount(spotPrice, poolPair.decimalsIn),
            tradeFeePct: fee.toString(),
            priceImpactPct: priceImpact.toString(),
          };
        },
      } as BuySwap);
    }
    return swaps;
  }
}
