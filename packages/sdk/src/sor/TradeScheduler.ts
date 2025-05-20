import {
  ORDER_MIN_BLOCK_PERIOD,
  TWAP_BLOCK_PERIOD,
  TWAP_MAX_PRICE_IMPACT,
  TWAP_MAX_DURATION,
} from './const';
import { TradeDcaOrder, TradeTwapOrder, TradeOrderError } from './types';

import { TradeRouter } from './TradeRouter';
import { TradeUtils } from './TradeUtils';

import { SubstrateTransaction } from '../api';
import { SYSTEM_ASSET_DECIMALS, SYSTEM_ASSET_ID } from '../consts';
import { BigNumber, bnum, toDecimals } from '../utils/bignumber';

export class TradeScheduler {
  readonly router: TradeRouter;
  readonly txUtils: TradeUtils;

  constructor(router: TradeRouter) {
    this.router = router;
    this.txUtils = router.utils;
  }

  /**
   * Build a DCA order
   *
   * @param assetIn - storage key of assetIn
   * @param assetOut - storage key of assetOut
   * @param amountInTotal - order budget
   * @param duration - order duration in ms
   * @param frequency - order frequency in ms (opts)
   * @returns - dca trade order
   */
  async getDcaOrder(
    assetIn: string,
    assetOut: string,
    amountInTotal: string | BigNumber,
    duration: number,
    frequency?: number
  ): Promise<TradeDcaOrder> {
    const [amountInMin, trade] = await Promise.all([
      this.getMinimumOrderBudget(assetIn),
      this.router.getBestSell(assetIn, assetOut, amountInTotal),
    ]);

    const { amountIn, swaps, priceImpactPct } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const { assetInDecimals } = firstSwap;
    const { assetOutDecimals } = lastSwap;

    const priceImpact = Math.abs(priceImpactPct);

    const minTradeCount = this.getMinimumTradeCount(amountIn, amountInMin);
    const optTradeCount = this.getOptimalTradeCount(priceImpact);
    const tradesCount = frequency
      ? Math.round(duration / frequency)
      : optTradeCount;

    const minFreq = Math.ceil(duration / minTradeCount);
    const optFreq = Math.round(duration / optTradeCount);
    const freq = Math.round(duration / tradesCount);

    const amountInPerTrade = amountIn
      .dividedBy(tradesCount)
      .decimalPlaces(0, 1);

    const dca = await this.router.getBestSell(
      assetIn,
      assetOut,
      toDecimals(amountInPerTrade, assetInDecimals)
    );

    const isLessThanMinimalAmount = amountIn.isLessThan(amountInMin);

    const errors: TradeOrderError[] = [];
    if (isLessThanMinimalAmount) {
      errors.push(TradeOrderError.OrderTooSmall);
    }

    const tradePeriod = this.toBlockPeriod(freq);
    const tradeRoute = this.txUtils.buildRoute(swaps);

    const order = {
      amountIn: amountIn,
      assetIn: assetIn,
      assetOut: assetOut,
      errors: errors,
      frequencyMin: minFreq,
      frequencyOpt: optFreq,
      frequency: freq,
      tradeAmountIn: dca.amountIn,
      tradeAmountOut: dca.amountOut,
      tradeCount: tradesCount,
      tradePeriod: tradePeriod,
      tradeRoute: tradeRoute,
    } as TradeDcaOrder;

    const orderTx = (
      beneficiary: string,
      maxRetries: number,
      slippagePct = 1
    ): SubstrateTransaction => {
      return this.txUtils.buildDcaTx(
        order,
        beneficiary,
        maxRetries,
        slippagePct
      );
    };

    return {
      ...order,
      toTx: orderTx,
      toHuman() {
        return {
          amountIn: toDecimals(amountIn, assetInDecimals),
          assetIn: assetIn,
          assetOut: assetOut,
          errors: errors,
          frequencyMin: minFreq,
          frequencyOpt: optFreq,
          frequency: freq,
          tradeAmountIn: toDecimals(dca.amountIn, assetInDecimals),
          tradeAmountOut: toDecimals(dca.amountOut, assetOutDecimals),
          tradeCount: tradesCount,
          tradePeriod: tradePeriod,
          tradeRoute: tradeRoute,
        };
      },
    } as TradeDcaOrder;
  }

  /**
   * Calculate minimum order budget (amountIn) required for order
   * execution.
   *
   * @param asset - assetIn id
   * @returns minimum order budget
   */
  private async getMinimumOrderBudget(asset: string): Promise<BigNumber> {
    if (SYSTEM_ASSET_ID === asset) {
      return this.txUtils.minOrderBudget;
    }

    const spot = await this.router.getBestSpotPrice(SYSTEM_ASSET_ID, asset);
    if (spot) {
      return this.txUtils.minOrderBudget
        .times(spot.amount)
        .div(bnum(10).pow(SYSTEM_ASSET_DECIMALS))
        .decimalPlaces(0, 1);
    }
    throw new Error('Unable to calculate order budget');
  }

  /**
   * Calculate minimum number of trades for order execution.
   *
   * Single trade execution amount must be at least 20% of
   * minimum order budget.
   *
   * @param amountIn - entering / given budget
   * @param amountInMin - minimal budget to schedule an order
   * @returns minimum number of trades to execute the order
   */
  private getMinimumTradeCount(
    amountIn: BigNumber,
    amountInMin: BigNumber
  ): number {
    const minAmountIn = amountInMin.multipliedBy(0.2);
    const res = amountIn.dividedBy(minAmountIn).toNumber();
    return Math.round(res);
  }

  /**
   * Calculate optimal number of trades for order execution.
   *
   * We aim to achieve price impact 0.1% per single execution
   * with at least 3 trades.
   *
   * @param priceImpact - price inpact of swap execution (via single trade)
   * @returns optimal number of trades to execute the order
   */
  private getOptimalTradeCount(priceImpact: number): number {
    const estTradeCount = Math.round(priceImpact * 10) || 1;
    return Math.max(estTradeCount, 3);
  }

  async getTwapSellOrder(
    assetIn: string,
    assetOut: string,
    amountInTotal: string | BigNumber
  ): Promise<TradeTwapOrder> {
    const [amountInMin, sell] = await Promise.all([
      this.getMinimumOrderBudget(assetIn),
      this.router.getBestSell(assetIn, assetOut, amountInTotal),
    ]);

    const { amountIn, swaps, priceImpactPct, type } = sell;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const { assetInDecimals } = firstSwap;
    const { assetOutDecimals } = lastSwap;

    const priceImpact = Math.abs(priceImpactPct);
    const tradeCount = this.getTwapTradeCount(priceImpact);

    const amountInPerTrade = amountIn.dividedBy(tradeCount).decimalPlaces(0, 1);

    const twap = await this.router.getBestSell(
      firstSwap.assetIn,
      lastSwap.assetOut,
      toDecimals(amountInPerTrade, assetInDecimals)
    );

    const isSingleTrade = tradeCount === 1;
    const isLessThanMinimalAmount = amountIn.isLessThan(amountInMin);
    const isOrderImpactTooBig = twap.priceImpactPct < TWAP_MAX_PRICE_IMPACT;

    const errors: TradeOrderError[] = [];
    if (isLessThanMinimalAmount || isSingleTrade) {
      errors.push(TradeOrderError.OrderTooSmall);
    } else if (isOrderImpactTooBig) {
      errors.push(TradeOrderError.OrderImpactTooBig);
    }

    const amountOut = twap.amountOut.multipliedBy(tradeCount);
    const tradeFee = twap.tradeFee.multipliedBy(tradeCount);
    const tradeRoute = this.txUtils.buildRoute(swaps);

    return {
      amountIn: amountIn,
      amountOut: amountOut,
      assetIn: assetIn,
      assetOut: assetOut,
      errors: errors,
      priceImpactPct: twap.priceImpactPct,
      tradeAmountIn: twap.amountIn,
      tradeAmountOut: twap.amountOut,
      tradeCount: tradeCount,
      tradeFee: tradeFee,
      tradePeriod: TWAP_BLOCK_PERIOD,
      tradeRoute: tradeRoute,
      tradeType: type,
      toHuman() {
        return {
          amountIn: toDecimals(amountIn, assetInDecimals),
          amountOut: toDecimals(amountOut, assetOutDecimals),
          assetIn: assetIn,
          assetOut: assetOut,
          errors: errors,
          priceImpactPct: twap.priceImpactPct,
          tradeAmountIn: toDecimals(twap.amountIn, assetInDecimals),
          tradeAmountOut: toDecimals(twap.amountOut, assetOutDecimals),
          tradeCount: tradeCount,
          tradeFee: toDecimals(tradeFee, assetOutDecimals),
          tradePeriod: TWAP_BLOCK_PERIOD,
          tradeRoute: tradeRoute,
          tradeType: type,
        };
      },
    } as TradeTwapOrder;
  }

  async getTwapBuyOrder(
    assetIn: string,
    assetOut: string,
    amountInTotal: string | BigNumber
  ): Promise<TradeTwapOrder> {
    const [amountInMin, buy] = await Promise.all([
      this.getMinimumOrderBudget(assetIn),
      this.router.getBestBuy(assetIn, assetOut, amountInTotal),
    ]);

    const { amountOut, swaps, priceImpactPct, type } = buy;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const { assetInDecimals } = firstSwap;
    const { assetOutDecimals } = lastSwap;

    const priceImpact = Math.abs(priceImpactPct);
    const tradeCount = this.getTwapTradeCount(priceImpact);

    const amountOutPerTrade = amountOut
      .dividedBy(tradeCount)
      .decimalPlaces(0, 1);

    const twap = await this.router.getBestBuy(
      firstSwap.assetIn,
      lastSwap.assetOut,
      toDecimals(amountOutPerTrade, assetOutDecimals)
    );

    const amountIn = twap.amountIn.multipliedBy(tradeCount);

    const isSingleTrade = tradeCount === 1;
    const isLessThanMinimalAmount = amountIn.isLessThan(amountInMin);
    const isOrderImpactTooBig = twap.priceImpactPct < TWAP_MAX_PRICE_IMPACT;

    const errors: TradeOrderError[] = [];
    if (isLessThanMinimalAmount || isSingleTrade) {
      errors.push(TradeOrderError.OrderTooSmall);
    } else if (isOrderImpactTooBig) {
      errors.push(TradeOrderError.OrderImpactTooBig);
    }

    const tradeFee = twap.tradeFee.multipliedBy(tradeCount);
    const tradeRoute = this.txUtils.buildRoute(swaps);

    return {
      amountIn: amountIn,
      amountOut: amountOut,
      assetIn: assetIn,
      assetOut: assetOut,
      errors: errors,
      priceImpactPct: twap.priceImpactPct,
      tradeAmountIn: twap.amountIn,
      tradeAmountOut: twap.amountOut,
      tradeCount: tradeCount,
      tradeFee: tradeFee,
      tradePeriod: TWAP_BLOCK_PERIOD,
      tradeRoute: tradeRoute,
      tradeType: type,
      toHuman() {
        return {
          amountIn: toDecimals(amountIn, assetInDecimals),
          amountOut: toDecimals(amountOut, assetOutDecimals),
          assetIn: assetIn,
          assetOut: assetOut,
          errors: errors,
          priceImpactPct: twap.priceImpactPct,
          tradeAmountIn: toDecimals(twap.amountIn, assetInDecimals),
          tradeAmountOut: toDecimals(twap.amountOut, assetOutDecimals),
          tradeCount: tradeCount,
          tradeFee: toDecimals(tradeFee, assetInDecimals),
          tradePeriod: TWAP_BLOCK_PERIOD,
          tradeRoute: tradeRoute,
          tradeType: type,
        };
      },
    } as TradeTwapOrder;
  }

  /**
   * Calculate number of trades for twap order execution.
   *
   * We aim to achieve price impact 0.1% per single execution
   * with max execution time 6 hours.
   *
   * @param priceImpact - price inpact of swap execution (via single trade)
   * @returns optimal number of trades to execute the twap order
   */
  private getTwapTradeCount(priceImpact: number): number {
    const optTradeCount = this.getOptimalTradeCount(priceImpact);
    const executionTime = this.getTwapExecutionTime(optTradeCount);

    if (executionTime > TWAP_MAX_DURATION) {
      const maxTradeCount =
        TWAP_MAX_DURATION / (this.txUtils.blockTime * TWAP_BLOCK_PERIOD);
      return Math.round(maxTradeCount);
    }
    return optTradeCount;
  }

  /**
   * Calculate approx. execution time for twap order.
   *
   * @param tradeCount - number of trades per order
   * @returns unix representation of execution time
   */
  private getTwapExecutionTime(tradeCount: number): number {
    return tradeCount * TWAP_BLOCK_PERIOD * this.txUtils.blockTime;
  }

  /**
   * Convert unix execution period to block period
   *
   * @param periodMsec - period in miliseconds
   * @returns block execution period
   */
  private toBlockPeriod(periodMsec: number): number {
    const noOfBlocks = periodMsec / this.txUtils.blockTime;
    const estPeriod = Math.round(noOfBlocks);
    return Math.max(estPeriod, ORDER_MIN_BLOCK_PERIOD);
  }
}
