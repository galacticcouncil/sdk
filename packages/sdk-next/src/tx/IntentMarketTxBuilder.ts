import { Enum } from 'polkadot-api';

import { Trade } from '../sor';
import { calc } from '../utils';

import { TxBuilder } from './TxBuilder';
import { Transaction, Tx } from './types';

export class IntentMarketTxBuilder extends TxBuilder {
  private _trade?: Trade;
  private _beneficiary?: string;
  private _slippagePct = 1;

  setTrade(trade: Trade): this {
    this._trade = trade;
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

  private get slippagePct(): number {
    return this._slippagePct;
  }

  async build(): Promise<Tx> {
    const { amountIn, amountOut, swaps } = this.trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;

    const slippage = calc.getFraction(amountOut, this.slippagePct);

    const minAmountOut = amountOut - slippage;

    const swap = Enum('Swap', {
      asset_in: assetIn,
      asset_out: assetOut,
      amount_in: amountIn,
      amount_out: minAmountOut,
      partial: false,
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

    return this.wrapTx('IntentSwap', tx);
  }
}
