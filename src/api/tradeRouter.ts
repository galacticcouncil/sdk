import { Router } from './router';
import { Hop, Pool, SellSwap, BuySwap, Trade, TradeType, Amount, Transaction, Swap } from '../types';
import { BigNumber, bnum, scale } from '../utils/bignumber';
import { calculatePriceImpact, calculateSellFee, calculateBuyFee } from '../utils/math';
import { toHuman } from '../utils/mapper';

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
   * Check whether trade is direct or not
   *
   * @param swaps - Trade route
   * @returns true if direct trade, otherwise false
   */
  private isDirectTrade(swaps: Swap[]) {
    return swaps.length == 1;
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
    const isDirect = this.isDirectTrade(bestRoute);

    const spotPrice = bestRoute
      .map((s: SellSwap) => s.spotPrice.shiftedBy(-1 * s.assetOutDecimals))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b));

    const bestRouteSpotPrice = scale(spotPrice, lastRoute.assetOutDecimals).decimalPlaces(0, 1);
    const bestRoutePriceImpactPct = calculatePriceImpact(
      firstRoute.amountIn,
      firstRoute.assetInDecimals,
      bestRouteSpotPrice,
      lastRoute.calculatedOut
    );

    const delta0Y = isDirect
      ? lastRoute.calculatedOut
      : this.calculateDelta0Y(firstRoute.amountIn, bestRoute, poolsMap);
    const deltaY = lastRoute.amountOut;
    const tradeFeePct = isDirect ? lastRoute.tradeFeePct : calculateSellFee(delta0Y, deltaY).toNumber();
    const tradeFee = delta0Y.minus(deltaY);

    const sellTx = (minAmountOut: BigNumber): Transaction => {
      return this.poolService.buildSellTx(
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
      tradeFee: tradeFee,
      tradeFeePct: tradeFeePct,
      priceImpactPct: bestRoutePriceImpactPct.toNumber(),
      swaps: bestRoute,
      toTx: sellTx,
      toHuman() {
        return {
          type: TradeType.Sell,
          amountIn: toHuman(firstRoute.amountIn, firstRoute.assetInDecimals),
          amountOut: toHuman(lastRoute.amountOut, lastRoute.assetOutDecimals),
          spotPrice: toHuman(bestRouteSpotPrice, lastRoute.assetOutDecimals),
          tradeFee: toHuman(tradeFee, lastRoute.assetOutDecimals),
          tradeFeePct: tradeFeePct,
          priceImpactPct: bestRoutePriceImpactPct.toNumber(),
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
      const pool = poolsMap.get(swap.poolId);
      if (pool == null) throw new Error('Pool does not exit');
      const poolPair = pool.parsePoolPair(swap.assetIn, swap.assetOut);
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

      const { amountOut, calculatedOut, feePct, errors } = pool.validateSell(poolPair, aIn);
      const spotPrice = pool.spotPriceOutGivenIn(poolPair);
      const priceImpactPct = calculatePriceImpact(aIn, poolPair.decimalsIn, spotPrice, calculatedOut);

      swaps.push({
        ...hop,
        assetInDecimals: poolPair.decimalsIn,
        assetOutDecimals: poolPair.decimalsOut,
        amountIn: aIn,
        calculatedOut: calculatedOut,
        amountOut: amountOut,
        spotPrice: spotPrice,
        tradeFeePct: feePct,
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
            priceImpactPct: priceImpactPct.toNumber(),
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
      const swapAFinal = a[0].amountIn;
      const swapBFinal = b[0].amountIn;
      return swapAFinal.isGreaterThan(swapBFinal) ? 1 : -1;
    })[0];

    const firstRoute = bestRoute[bestRoute.length - 1];
    const lastRoute = bestRoute[0];
    const isDirect = this.isDirectTrade(bestRoute);

    const spotPrice = bestRoute
      .map((s: BuySwap) => s.spotPrice.shiftedBy(-1 * s.assetInDecimals))
      .reduce((a: BigNumber, b: BigNumber) => a.multipliedBy(b));

    const bestRouteSpotPrice = scale(spotPrice, lastRoute.assetInDecimals).decimalPlaces(0, 1);
    const bestRoutePriceImpactPct = calculatePriceImpact(
      firstRoute.amountOut,
      firstRoute.assetOutDecimals,
      bestRouteSpotPrice,
      lastRoute.calculatedIn
    );

    const delta0X = isDirect
      ? lastRoute.calculatedIn
      : this.calculateDelta0X(firstRoute.amountOut, bestRoute, poolsMap);
    const deltaX = lastRoute.amountIn;
    const tradeFeePct = isDirect ? lastRoute.tradeFeePct : calculateBuyFee(delta0X, deltaX);
    const tradeFee = deltaX.minus(delta0X);

    const buyTx = (maxAmountIn: BigNumber): Transaction => {
      return this.poolService.buildBuyTx(
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
      tradeFee: tradeFee,
      tradeFeePct: tradeFeePct,
      priceImpactPct: bestRoutePriceImpactPct.toNumber(),
      swaps: bestRoute,
      toTx: buyTx,
      toHuman() {
        return {
          type: TradeType.Buy,
          amountOut: toHuman(firstRoute.amountOut, firstRoute.assetOutDecimals),
          amountIn: toHuman(lastRoute.amountIn, lastRoute.assetInDecimals),
          spotPrice: toHuman(bestRouteSpotPrice, lastRoute.assetInDecimals),
          tradeFee: toHuman(tradeFee, lastRoute.assetInDecimals),
          tradeFeePct: tradeFeePct,
          priceImpactPct: bestRoutePriceImpactPct.toNumber(),
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
      const pool = poolsMap.get(swap.poolId);
      if (pool == null) throw new Error('Pool does not exit');
      const poolPair = pool.parsePoolPair(swap.assetIn, swap.assetOut);
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
        aOut = swaps[0].amountIn;
      }

      const { amountIn, calculatedIn, feePct, errors } = pool.validateBuy(poolPair, aOut);
      const spotPrice = pool.spotPriceInGivenOut(poolPair);
      const priceImpactPct = calculatePriceImpact(aOut, poolPair.decimalsOut, spotPrice, calculatedIn);

      swaps.unshift({
        ...hop,
        assetInDecimals: poolPair.decimalsIn,
        assetOutDecimals: poolPair.decimalsOut,
        amountOut: aOut,
        calculatedIn: calculatedIn,
        amountIn: amountIn,
        spotPrice: spotPrice,
        tradeFeePct: feePct,
        priceImpactPct: priceImpactPct.toNumber(),
        errors: errors,
        toHuman() {
          return {
            ...hop,
            amountOut: toHuman(aOut, poolPair.decimalsOut),
            calculatedIn: toHuman(calculatedIn, poolPair.decimalsIn),
            amountIn: toHuman(amountIn, poolPair.decimalsIn),
            spotPrice: toHuman(spotPrice, poolPair.decimalsIn),
            tradeFeePct: feePct,
            priceImpactPct: priceImpactPct.toNumber(),
          };
        },
      } as BuySwap);
    }
    return swaps;
  }
}
