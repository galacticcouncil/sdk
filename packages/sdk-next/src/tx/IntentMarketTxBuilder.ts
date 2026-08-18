import { Enum } from 'polkadot-api';

import { Trade, TradeType } from '../sor';
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
    const { type } = this.trade;

    if (type === TradeType.Buy) {
      return this.buildBuyTx();
    }
    return this.buildSellTx();
  }

  /**
   * Sell intent: user commits an exact amount_in, slippage lowers the
   * amount_out floor below the quote so the intent is fillable right
   * away within the user's tolerance.
   */
  private async buildSellTx(): Promise<Tx> {
    const { amountIn, amountOut } = this.trade;

    const slippage = calc.getFraction(amountOut, this.slippagePct);
    const minAmountOut = amountOut - slippage;

    return this.buildSwapTx(amountIn, minAmountOut);
  }

  /**
   * Buy intent translated to sell semantics: amount_out floor is the
   * exact amount the user asked to receive (never lowered), slippage
   * pads amount_in above the quote so the intent is fillable right
   * away within the user's tolerance. Worst case matches a classic
   * buy with max_amount_in; any surplus is delivered as extra
   * amount_out.
   */
  private async buildBuyTx(): Promise<Tx> {
    const { amountIn, amountOut } = this.trade;

    const slippage = calc.getFraction(amountIn, this.slippagePct);
    const maxAmountIn = amountIn + slippage;

    return this.buildSwapTx(maxAmountIn, amountOut);
  }

  private async buildSwapTx(
    amountIn: bigint,
    minAmountOut: bigint
  ): Promise<Tx> {
    const { swaps } = this.trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;

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
