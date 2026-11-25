import { Enum } from 'polkadot-api';

import { TradeOrder, TradeOrderType } from '../sor';
import { calc } from '../utils';

import { TxBuilder } from './TxBuilder';
import { IntentForward, Transaction, Tx } from './types';

export class IntentOrderTxBuilder extends TxBuilder {
  private _order?: TradeOrder;
  private _beneficiary?: string;
  private _slippagePct = 1;
  private _minAmountOut?: bigint;
  private _forward?: IntentForward;

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

  /**
   * Pins the least output of each TWAP trade.
   *
   * - Takes precedence over the slippage-derived floor
   * - Ignored by DCA, which floors at the output asset's ED
   *
   * @param amount - least `asset_out` per trade, in its smallest unit
   */
  withMinAmountOut(amount: bigint): this {
    this._minAmountOut = amount;
    return this;
  }

  /**
   * Calls a contract each time a trade of the order resolves.
   *
   * @param forward - contract and calldata
   */
  withForward(forward: IntentForward): this {
    this._forward = forward;
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
        return this.buildTwapTx();
      default:
        throw new Error(`Unsupported TradeOrderType: ${type}`);
    }
  }

  private async buildDcaTx(): Promise<Tx> {
    const {
      amountIn,
      assetIn,
      assetOut,
      assetOutEd,
      tradeAmountIn,
      tradePeriod,
    } = this.order;

    const dca = Enum('Dca', {
      asset_in: assetIn,
      asset_out: assetOut,
      amount_in: tradeAmountIn,
      amount_out: assetOutEd,
      slippage: this.slippagePct * 10000,
      budget: amountIn || undefined,
      period: tradePeriod,
    });

    let tx: Transaction = this.api.tx.Intent.submit_intent({
      intent: {
        data: dca,
        on_resolved: this.onResolved(this._forward),
      },
    });

    if (await this.aaveUtils.requiresExtraGas(this.beneficiary, assetIn)) {
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
    const minAmountOut = this._minAmountOut ?? tradeAmountOut - slippage;

    const dca = Enum('Dca', {
      asset_in: assetIn,
      asset_out: assetOut,
      amount_in: tradeAmountIn,
      amount_out: minAmountOut,
      slippage: this.slippagePct * 10000,
      budget: amountIn,
      period: tradePeriod,
    });

    let tx: Transaction = this.api.tx.Intent.submit_intent({
      intent: {
        data: dca,
        on_resolved: this.onResolved(this._forward),
      },
    });

    if (await this.aaveUtils.requiresExtraGas(this.beneficiary, assetIn)) {
      tx = await this.dispatchWithExtraGas(tx);
    }

    return this.wrapTx('IntentDcaSchedule.twap', tx);
  }
}
