import { Enum } from 'polkadot-api';

import { TradeOrder, TradeOrderType } from '../sor';

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

  /**
   * Clamp the order's block period to the runtime minimum — the intent
   * pallet rejects anything below `MinDcaPeriod` (InvalidDcaPeriod) and
   * the constant differs per network (e.g. 15 on lark vs the scheduler's
   * 6-block TWAP interval).
   */
  private async getDcaPeriod(tradePeriod: number): Promise<number> {
    const minPeriod = await this.apiIce.constants.Intent.MinDcaPeriod();
    return Math.max(tradePeriod, minPeriod);
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
      budget: amountIn,
      period: await this.getDcaPeriod(tradePeriod),
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
      assetOutEd,
      tradeAmountIn,
      tradePeriod,
    } = this.order;

    // No absolute per-slice floor (ED is the lowest the pallet accepts,
    // functionally min_amount_out=0). Per-slice protection is the pallet's
    // adaptive oracle limit driven by `slippage`, recomputed at every
    // resolve — a floor frozen from the setup quote would stop filling
    // (and, with no max_retries, zombie forever) once the order's own
    // price impact or market drift exceeds the tolerance.
    const dca = Enum('Dca', {
      asset_in: assetIn,
      asset_out: assetOut,
      amount_in: tradeAmountIn,
      amount_out: assetOutEd,
      slippage: this.slippagePct * 10000,
      budget: amountIn,
      period: await this.getDcaPeriod(tradePeriod),
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

    return this.wrapTx('IntentDcaSchedule.twap', tx);
  }
}
