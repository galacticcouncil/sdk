import { Enum } from 'polkadot-api';

import { Trade } from '../sor';

import { TxBuilder } from './TxBuilder';
import { Transaction, Tx } from './types';

export class IntentLimitTxBuilder extends TxBuilder {
  private _trade?: Trade;
  private _beneficiary?: string;
  private _minAmountOut?: bigint;
  private _deadline?: bigint;
  private _matchWindow?: bigint;
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

  withDeadline(deadline: bigint): this {
    this._deadline = deadline;
    return this;
  }

  /**
   * Submits the swap as a match-first intent.
   *
   * - Until the window ends, the solver gets it only against opposite intents
   * - After that it fills like a plain swap
   * - The window starts at inclusion and must end before the deadline
   *
   * @param window - match window in ms
   */
  withMatchWindow(window: bigint): this {
    this._matchWindow = window;
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

  private get deadline(): bigint | undefined {
    return this._deadline;
  }

  private get matchWindow(): bigint | undefined {
    return this._matchWindow;
  }

  async build(): Promise<Tx> {
    const { amountIn, amountOut, swaps } = this.trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;

    const swap = {
      asset_in: assetIn,
      asset_out: assetOut,
      amount_in: amountIn,
      amount_out: this.minAmountOut ?? amountOut,
      partial: this.partial,
    };

    let tx: Transaction = this.api.tx.Intent.submit_intent({
      intent: {
        data:
          this.matchWindow === undefined
            ? Enum('Swap', swap)
            : Enum('MatchFirstSwap', {
                swap,
                match_window: this.matchWindow,
              }),
        deadline: this.deadline,
      },
    });

    if (await this.aaveUtils.requiresExtraGas(this.beneficiary, assetIn)) {
      tx = await this.dispatchWithExtraGas(tx);
    }

    return this.wrapTx('IntentLimitOrder', tx);
  }
}
