import { Enum } from 'polkadot-api';

import { TradeOrder, TradeOrderType } from '../sor';
import { calc } from '../utils';

import { TxBuilder } from './TxBuilder';
import { Transaction, Tx } from './types';

export class OrderTxBuilder extends TxBuilder {
  private _order?: TradeOrder;
  private _beneficiary?: string;
  private _maxRetries = 3;
  private _slippagePct = 1;

  setOrder(order: TradeOrder): this {
    this._order = order;
    return this;
  }

  withBeneficiary(beneficiary: string): this {
    this._beneficiary = beneficiary;
    return this;
  }

  withMaxRetries(maxRetries: number): this {
    this._maxRetries = maxRetries;
    return this;
  }

  withSlippage(slippage: number): this {
    this._slippagePct = slippage;
    return this;
  }

  private get order(): TradeOrder {
    if (!this._order) {
      throw new Error('Order not set. Use setOrder().');
    }
    return this._order;
  }

  private get beneficiary(): string {
    if (!this._beneficiary) {
      throw new Error('Beneficiary not set. Use withBeneficiary().');
    }
    return this._beneficiary;
  }

  private get maxRetries(): number {
    return this._maxRetries;
  }

  private get slippagePct(): number {
    return this._slippagePct;
  }

  async build(): Promise<Tx> {
    const { type } = this.order;
    switch (type) {
      case TradeOrderType.Dca:
        return this.buildDcaTx();
      case TradeOrderType.TwapSell:
        return this.buildTwapSellTx();
      case TradeOrderType.TwapBuy:
        return this.buildTwapBuyTx();
      default:
        throw new Error(`Unsupported TradeOrderType: ${type}`);
    }
  }

  private buildDcaTx(): Tx {
    const {
      amountIn,
      assetIn,
      assetOut,
      tradeAmountIn,
      tradePeriod,
      tradeRoute,
    } = this.order;

    const tx: Transaction = this.api.tx.DCA.schedule({
      schedule: {
        owner: this.beneficiary,
        period: tradePeriod,
        max_retries: this.maxRetries,
        total_amount: amountIn,
        slippage: this.slippagePct * 10000,
        stability_threshold: undefined,
        order: Enum('Sell', {
          asset_in: assetIn,
          asset_out: assetOut,
          amount_in: tradeAmountIn,
          min_amount_out: 0n,
          route: tradeRoute as any,
        }),
      },
      start_execution_block: undefined,
    });

    return this.wrapTx('DcaSchedule', tx);
  }

  private buildTwapSellTx(): Tx {
    const {
      amountIn,
      assetIn,
      assetOut,
      tradeAmountIn,
      tradeAmountOut,
      tradePeriod,
      tradeRoute,
    } = this.order;

    const slippage = calc.getFraction(tradeAmountOut, this.slippagePct);
    const minAmountOut = tradeAmountOut - slippage;

    const tx: Transaction = this.api.tx.DCA.schedule({
      schedule: {
        owner: this.beneficiary,
        period: tradePeriod,
        max_retries: this.maxRetries,
        total_amount: amountIn,
        slippage: this.slippagePct * 10000,
        stability_threshold: undefined,
        order: Enum('Sell', {
          asset_in: assetIn,
          asset_out: assetOut,
          amount_in: tradeAmountIn,
          min_amount_out: minAmountOut,
          route: tradeRoute as any,
        }),
      },
      start_execution_block: undefined,
    });

    return this.wrapTx('DcaSchedule.twapSell', tx);
  }

  private buildTwapBuyTx(): Tx {
    const {
      amountIn,
      assetIn,
      assetOut,
      tradeAmountIn,
      tradeAmountOut,
      tradePeriod,
      tradeRoute,
    } = this.order;

    const slippage = calc.getFraction(tradeAmountIn, this.slippagePct);
    const maxAmountIn = tradeAmountIn + slippage;

    const tx: Transaction = this.api.tx.DCA.schedule({
      schedule: {
        owner: this.beneficiary,
        period: tradePeriod,
        max_retries: this.maxRetries,
        total_amount: amountIn,
        slippage: this.slippagePct * 10000,
        stability_threshold: undefined,
        order: Enum('Buy', {
          asset_in: assetIn,
          asset_out: assetOut,
          amount_out: tradeAmountOut,
          max_amount_in: maxAmountIn,
          route: tradeRoute as any,
        }),
      },
      start_execution_block: undefined,
    });

    return this.wrapTx('DcaSchedule.twapBuy', tx);
  }
}
