import { Enum } from 'polkadot-api';

import { TradeOrder, TradeOrderType } from '../sor';
import { calc } from '../utils';

import { TxBuilder } from './TxBuilder';
import { Transaction, Tx } from './types';

export class IntentOrderTxBuilder extends TxBuilder {
  private _order?: TradeOrder;
  private _beneficiary?: string;
  private _slippagePct = 1;

  setOrder(order: TradeOrder): this {
    this._order = order;
    return this;
  }

  withBeneficiary(beneficiary: string): this {
    this._beneficiary = beneficiary;
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

  private get slippagePct(): number {
    return this._slippagePct;
  }

  async build(): Promise<Tx> {
    const { type } = this.order;
    switch (type) {
      case TradeOrderType.Dca:
        return this.buildDcaTx();
      case TradeOrderType.TwapSell:
      case TradeOrderType.TwapBuy:
        return this.buildTwapTx();
      default:
        throw new Error(`Unsupported TradeOrderType: ${type}`);
    }
  }

  private async buildDcaTx(): Promise<Tx> {
    const { amountIn, assetIn, assetOut, tradeAmountIn, tradePeriod } =
      this.order;

    const dca = Enum('Dca', {
      asset_in: assetIn,
      asset_out: assetOut,
      amount_in: tradeAmountIn,
      amount_out: 1n,
      slippage: this.slippagePct * 10000,
      budget: amountIn,
      period: tradePeriod,
    });

    let tx: Transaction = this.apiIce.tx.Intent.submit_intent({
      intent: {
        data: dca,
      },
    });

    const hasDebt = await this.aaveUtils.hasBorrowPositions(this.beneficiary);
    if (hasDebt) {
      tx = await this.dispatchWithExtraGas(tx);
    }

    return this.wrapTx('IntentDcaSchedule', tx);
  }

  private async buildTwapTx(): Promise<Tx> {
    const {
      amountIn,
      assetIn,
      assetOut,
      tradeAmountIn,
      tradeAmountOut,
      tradePeriod,
    } = this.order;

    const slippage = calc.getFraction(tradeAmountOut, this.slippagePct);
    const minAmountOut = tradeAmountOut - slippage;

    const dca = Enum('Dca', {
      asset_in: assetIn,
      asset_out: assetOut,
      amount_in: tradeAmountIn,
      amount_out: minAmountOut,
      slippage: this.slippagePct * 10000,
      budget: amountIn,
      period: tradePeriod,
    });

    let tx: Transaction = this.apiIce.tx.Intent.submit_intent({
      intent: {
        data: dca,
      },
    });

    return this.wrapTx('IntentTwapSchedule', tx);
  }
}
