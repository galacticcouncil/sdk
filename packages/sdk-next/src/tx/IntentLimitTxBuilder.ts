import { Enum } from 'polkadot-api';

import { Trade } from '../sor';

import { TxBuilder } from './TxBuilder';
import { Transaction, Tx } from './types';

export class IntentLimitTxBuilder extends TxBuilder {
  private _trade?: Trade;
  private _beneficiary?: string;
  private _minAmountOut?: bigint;
  private _partial = true;

  setTrade(trade: Trade): this {
    this._trade = trade;
    return this;
  }

  withBeneficiary(beneficiary: string): this {
    this._beneficiary = beneficiary;
    return this;
  }

  withPartial(partial: boolean): this {
    this._partial = partial;
    return this;
  }

  withMinAmountOut(amount: bigint): this {
    this._minAmountOut = amount;
    return this;
  }

  private get trade(): Trade {
    if (!this._trade) {
      throw new Error('Trade not set. Use setTrade().');
    }
    return this._trade;
  }

  private get beneficiary(): string {
    if (!this._beneficiary) {
      throw new Error('Beneficiary not set. Use withBeneficiary().');
    }
    return this._beneficiary;
  }

  private get partial(): boolean {
    return this._partial;
  }

  private get minAmountOut(): bigint | undefined {
    return this._minAmountOut;
  }

  async build(): Promise<Tx> {
    const { amountIn, amountOut, swaps } = this.trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;

    const swap = Enum('Swap', {
      asset_in: assetIn,
      asset_out: assetOut,
      amount_in: amountIn,
      amount_out: this.minAmountOut ?? amountOut,
      partial: this.partial,
    });

    let tx: Transaction = this.apiIce.tx.Intent.submit_intent({
      intent: {
        data: swap,
      },
    });

    const hasDebt = await this.aaveUtils.hasBorrowPositions(this.beneficiary);
    if (hasDebt) {
      tx = await this.dispatchWithExtraGas(tx);
    }

    return this.wrapTx('IntentLimitOrder', tx);
  }
}
