import { big } from '@galacticcouncil/common';

import {
  DCA_TIME_RESERVE,
  ORDER_MIN_BLOCK_PERIOD,
  TWAP_EXECUTION_INTERVAL_MS,
  TWAP_MAX_PRICE_IMPACT,
  TWAP_MAX_DURATION,
} from './const';
import {
  TradeDcaOrder,
  TradeOrder,
  TradeOrderError,
  TradeOrderType,
} from './types';

import { TradeRouter } from './TradeRouter';

import { TradeRouteBuilder } from './TradeRouteBuilder';

import { BLOCK_TIME_TARGET } from '../consts';
import { IPoolCtxProvider, PoolType } from '../pool';

export type TradeSchedulerOptions = {
  blockTime?: number;
  minimalPeriod?: number;
};

/**
 * Order cadence is denominated in the target rate, not the observed one.
 *
 * - The chain schedules in blocks and derives its own block-denominated
 *   constants from the target, so a period must be built on the same basis
 * - A missed block stretches an order in wall clock; it does not change the
 *   period the order was written with
 */
export class TradeScheduler {
  protected readonly router: TradeRouter;

  readonly blockTime: number;
  readonly minimalPeriod: number;

  constructor(ctx: IPoolCtxProvider, options: TradeSchedulerOptions = {}) {
    this.router = new TradeRouter(ctx);
    this.router.withFilter({ exclude: [PoolType.HSM] });

    this.blockTime = options.blockTime ?? BLOCK_TIME_TARGET;
    this.minimalPeriod = options.minimalPeriod ?? ORDER_MIN_BLOCK_PERIOD;
  }

  /**
   * Build a DCA (Dollar Cost Averaging) order
   *
   * @param assetIn - storage key of assetIn
   * @param assetOut - storage key of assetOut
   * @param amountInTotal - order budget
   * @param duration - order duration in ms
   * @param noOfTrades - number of trades within the order
   * @returns - dca trade order
   */
  async getDcaOrder(
    assetIn: number,
    assetOut: number,
    amountInTotal: string,
    duration: number,
    noOfTrades?: number
  ): Promise<TradeDcaOrder> {
    const trade = await this.router.getBestSell(
      assetIn,
      assetOut,
      amountInTotal
    );

    const { amountIn, swaps, priceImpactPct } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const { assetInDecimals } = firstSwap;
    const { assetOutDecimals } = lastSwap;

    const priceImpact = Math.abs(priceImpactPct);

    const [assetInEd, assetOutEd] = await Promise.all([
      this.getAssetEd(firstSwap.poolAddress, firstSwap.assetIn),
      this.getAssetEd(lastSwap.poolAddress, lastSwap.assetOut),
    ]);

    const minTradeAmount = this.getMinTradeAmount(
      amountIn,
      trade.amountOut,
      assetInEd,
      assetOutEd
    );

    const optTradeCount = this.getOptimalTradeCount(priceImpact);
    const maxTradeCount = Math.max(
      this.getMaximumTradeCount(amountIn, minTradeAmount, duration),
      1
    );
    const tradeCount = noOfTrades || Math.min(optTradeCount, maxTradeCount);

    const frequency = Math.round(duration / tradeCount);
    const amountInPerTrade = amountIn / BigInt(tradeCount);

    const dca = await this.router.getBestSell(
      assetIn,
      assetOut,
      amountInPerTrade
    );

    const errors: TradeOrderError[] = [];
    if (dca.amountIn < assetInEd || dca.amountOut < assetOutEd) {
      errors.push(TradeOrderError.OrderTooSmall);
    }

    const amountOut = dca.amountOut * BigInt(tradeCount);
    const tradePeriod = this.toBlockPeriod(frequency);
    const tradeFee = dca.tradeFee * BigInt(tradeCount);
    const tradeRoute = TradeRouteBuilder.build(swaps);

    const order = {
      assetIn: assetIn,
      assetOut: assetOut,
      assetOutEd: assetOutEd,
      errors: errors,
      maxTradeCount: maxTradeCount,
      tradeCount: tradeCount,
      tradeFee: tradeFee,
      tradeImpactPct: dca.priceImpactPct,
      tradePeriod: tradePeriod,
      tradeRoute: tradeRoute,
      type: TradeOrderType.Dca,
    } as Partial<TradeDcaOrder>;

    return {
      ...order,
      amountIn: amountIn,
      amountOut: amountOut,
      tradeAmountIn: dca.amountIn,
      tradeAmountOut: dca.amountOut,
      toHuman() {
        return {
          ...order,
          amountIn: big.toDecimal(amountIn, assetInDecimals),
          amountOut: big.toDecimal(amountOut, assetOutDecimals),
          assetOutEd: big.toDecimal(assetOutEd, assetOutDecimals),
          tradeAmountIn: big.toDecimal(dca.amountIn, assetInDecimals),
          tradeAmountOut: big.toDecimal(dca.amountOut, assetOutDecimals),
        };
      },
    } as TradeDcaOrder;
  }

  /**
   * Smallest per-trade amountIn the chain accepts.
   *
   * - Input must cover the assetIn existential deposit
   * - Output must cover the assetOut existential deposit, priced at the
   *   order's average rate
   * - A zero quote fits no trade
   *
   * @param amountIn - order budget
   * @param amountOut - order output at the quoted rate
   * @param assetInEd - assetIn existential deposit
   * @param assetOutEd - assetOut existential deposit
   * @returns minimum per-trade amountIn, at least one unit
   */
  protected getMinTradeAmount(
    amountIn: bigint,
    amountOut: bigint,
    assetInEd: bigint,
    assetOutEd: bigint
  ): bigint {
    if (amountOut === 0n) return amountIn + 1n;

    const outEdIn = (assetOutEd * amountIn + amountOut - 1n) / amountOut;
    return [assetInEd, outEdIn, 1n].reduce((a, b) => (a > b ? a : b));
  }

  /**
   * Calculate maximum number of trades for dca order execution.
   *
   * - Each trade must be at least the minimum trade amount
   * - Block period can't exceed total duration
   *
   * @param amountIn - entering / given budget
   * @param minTradeAmount - smallest per-trade amountIn the chain accepts
   * @param duration - order duration in ms
   * @returns maximum number of trades to execute the order
   */
  protected getMaximumTradeCount(
    amountIn: bigint,
    minTradeAmount: bigint,
    duration: number
  ): number {
    if (minTradeAmount === 0n) return 0;

    const maxByBudget = Number(amountIn / minTradeAmount);
    const minSpacing = this.blockTime * this.minimalPeriod;
    const maxByTimeRaw = Math.floor(duration / minSpacing);

    const maxByTime = Math.max(
      0,
      Math.floor(maxByTimeRaw * (1 - DCA_TIME_RESERVE))
    );

    return Math.min(maxByBudget, maxByTime);
  }

  /**
   * Calculate optimal number of trades for order execution.
   *
   * We aim to achieve price impact 0.1% per single execution
   * with at least 3 trades.
   *
   * @param priceImpact - price impact of swap execution (single trade)
   * @returns optimal number of trades to execute the order
   */
  protected getOptimalTradeCount(priceImpact: number): number {
    const estTradeCount = Math.round(priceImpact * 10) || 1;
    return Math.max(estTradeCount, 3);
  }

  /**
   * Build an open budget DCA (Dollar Cost Averaging) order.
   *
   * @param assetIn - storage key of assetIn
   * @param assetOut - storage key of assetOut
   * @param amountIn - per-trade amount
   * @param periodMs - interval between trades in ms
   * @returns - dca trade order with amountIn = 0 (open budget)
   */
  async getOpenBudgetDcaOrder(
    assetIn: number,
    assetOut: number,
    amountIn: string,
    periodMs: number
  ): Promise<TradeDcaOrder> {
    const trade = await this.router.getBestSell(assetIn, assetOut, amountIn);

    const { swaps } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const { assetInDecimals } = firstSwap;
    const { assetOutDecimals } = lastSwap;

    const [assetInEd, assetOutEd] = await Promise.all([
      this.getAssetEd(firstSwap.poolAddress, firstSwap.assetIn),
      this.getAssetEd(lastSwap.poolAddress, lastSwap.assetOut),
    ]);

    const errors: TradeOrderError[] = [];
    if (trade.amountIn < assetInEd || trade.amountOut < assetOutEd) {
      errors.push(TradeOrderError.OrderTooSmall);
    }

    const tradePeriod = this.toBlockPeriod(periodMs);
    const tradeRoute = TradeRouteBuilder.build(swaps);

    const order = {
      assetIn: assetIn,
      assetOut: assetOut,
      assetOutEd: assetOutEd,
      errors: errors,
      maxTradeCount: 0,
      tradeCount: 0,
      tradeFee: trade.tradeFee,
      tradeImpactPct: trade.priceImpactPct,
      tradePeriod: tradePeriod,
      tradeRoute: tradeRoute,
      type: TradeOrderType.Dca,
    } as Partial<TradeDcaOrder>;

    return {
      ...order,
      amountIn: 0n,
      amountOut: 0n,
      tradeAmountIn: trade.amountIn,
      tradeAmountOut: trade.amountOut,
      toHuman() {
        return {
          ...order,
          amountIn: '0',
          amountOut: '0',
          assetOutEd: big.toDecimal(assetOutEd, assetOutDecimals),
          tradeAmountIn: big.toDecimal(trade.amountIn, assetInDecimals),
          tradeAmountOut: big.toDecimal(trade.amountOut, assetOutDecimals),
        };
      },
    } as TradeDcaOrder;
  }

  /**
   * Build a TWAP (Time-Weighted Average Price) sell order
   *
   * @param assetIn - assetIn id
   * @param assetOut - assetOut id
   * @param amountInTotal - order budget
   * @returns twap trade order
   */
  async getTwapSellOrder(
    assetIn: number,
    assetOut: number,
    amountInTotal: string
  ): Promise<TradeOrder> {
    const sell = await this.router.getBestSell(
      assetIn,
      assetOut,
      amountInTotal
    );

    const { amountIn, swaps, priceImpactPct } = sell;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const { assetInDecimals } = firstSwap;
    const { assetOutDecimals } = lastSwap;

    const priceImpact = Math.abs(priceImpactPct);
    const tradeCount = this.getTwapTradeCount(priceImpact);

    const amountInPerTrade = amountIn / BigInt(tradeCount);

    const [assetInEd, assetOutEd, twap] = await Promise.all([
      this.getAssetEd(firstSwap.poolAddress, firstSwap.assetIn),
      this.getAssetEd(lastSwap.poolAddress, lastSwap.assetOut),
      this.router.getBestSell(
        firstSwap.assetIn,
        lastSwap.assetOut,
        amountInPerTrade
      ),
    ]);

    const isSingleTrade = tradeCount === 1;
    const isTradeTooSmall =
      twap.amountIn < assetInEd || twap.amountOut < assetOutEd;
    const isOrderImpactTooBig = twap.priceImpactPct < TWAP_MAX_PRICE_IMPACT;

    const errors: TradeOrderError[] = [];
    if (isTradeTooSmall || isSingleTrade) {
      errors.push(TradeOrderError.OrderTooSmall);
    } else if (isOrderImpactTooBig) {
      errors.push(TradeOrderError.OrderImpactTooBig);
    }

    const amountOut = twap.amountOut * BigInt(tradeCount);
    const tradeFee = twap.tradeFee * BigInt(tradeCount);
    const tradeRoute = TradeRouteBuilder.build(swaps);

    const order = {
      assetIn: assetIn,
      assetOut: assetOut,
      assetOutEd: assetOutEd,
      errors: errors,
      tradeCount: tradeCount,
      tradeImpactPct: twap.priceImpactPct,
      tradePeriod: this.toBlockPeriod(TWAP_EXECUTION_INTERVAL_MS),
      tradeRoute: tradeRoute,
      type: TradeOrderType.TwapSell,
    } as Partial<TradeOrder>;

    return {
      ...order,
      amountIn: amountIn,
      amountOut: amountOut,
      tradeAmountIn: twap.amountIn,
      tradeAmountOut: twap.amountOut,
      tradeFee: tradeFee,
      toHuman() {
        return {
          ...order,
          amountIn: big.toDecimal(amountIn, assetInDecimals),
          amountOut: big.toDecimal(amountOut, assetOutDecimals),
          assetOutEd: big.toDecimal(assetOutEd, assetOutDecimals),
          tradeAmountIn: big.toDecimal(twap.amountIn, assetInDecimals),
          tradeAmountOut: big.toDecimal(twap.amountOut, assetOutDecimals),
          tradeFee: big.toDecimal(tradeFee, assetOutDecimals),
        };
      },
    } as TradeOrder;
  }

  /**
   * Calculate number of trades for twap order execution.
   *
   * We aim to achieve price impact 0.1% per single execution
   * with max execution time 6 hours.
   *
   * @param priceImpact - price impact of swap execution (via single trade)
   * @returns optimal number of trades to execute the order
   */
  getTwapTradeCount(priceImpact: number): number {
    const optTradeCount = this.getOptimalTradeCount(priceImpact);
    const executionTime = this.getTwapExecutionTime(optTradeCount);

    if (executionTime > TWAP_MAX_DURATION) {
      return Math.floor(TWAP_MAX_DURATION / this.twapInterval());
    }
    return optTradeCount;
  }

  /**
   * Calculate approx. execution time for twap order.
   *
   * @param tradeCount - number of trades per order
   * @returns unix representation of execution time
   */
  getTwapExecutionTime(tradeCount: number): number {
    return tradeCount * this.twapInterval();
  }

  /**
   * Twap interval in ms, as scheduled.
   *
   * - The block period is what the chain executes on, so the wall clock it
   *   maps back to is the interval orders actually run at
   */
  private twapInterval(): number {
    return this.toBlockPeriod(TWAP_EXECUTION_INTERVAL_MS) * this.blockTime;
  }

  /**
   * Convert unix execution period to block period
   *
   * @param periodMsec - period in miliseconds
   * @returns block execution period
   */
  private toBlockPeriod(periodMsec: number): number {
    const noOfBlocks = periodMsec / this.blockTime;
    const estPeriod = Math.round(noOfBlocks);
    return Math.max(estPeriod, this.minimalPeriod);
  }

  /**
   * Resolve the on-chain existential deposit of an asset from a pool it
   * trades in.
   *
   * - DCA intents require per-trade `amount_in` and `amount_out` to cover
   *   the existential deposits of their assets
   * - An unknown asset or deposit throws
   *
   * @param poolAddress - pool holding the asset
   * @param asset - asset id
   * @returns existential deposit (in its smallest unit)
   */
  private async getAssetEd(
    poolAddress: string,
    asset: number
  ): Promise<bigint> {
    const pools = await this.router.getPools();
    const pool = pools.find((p) => p.address === poolAddress);
    const token = pool?.tokens.find((t) => t.id === asset);
    if (token?.existentialDeposit === undefined) {
      throw new Error(
        `Existential deposit of asset ${asset} not found in pool ${poolAddress}`
      );
    }
    return token.existentialDeposit;
  }
}
