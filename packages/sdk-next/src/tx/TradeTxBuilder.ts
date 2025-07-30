import { Trade, TradeRouteBuilder, TradeType } from '../sor';
import { math } from '../utils';

import { TxBuilder } from './TxBuilder';
import { Transaction, Tx } from './types';

export class TradeTxBuilder extends TxBuilder {
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
    const { amountIn, swaps, type } = this.trade;

    if (type === TradeType.Buy) {
      return this.buildBuyTx();
    }

    const { assetIn } = swaps[0];

    const balance = await this.balanceClient.getBalance(
      this.beneficiary,
      assetIn
    );
    const isMax = amountIn >= balance - 5n;

    if (isMax) {
      return this.buildSellAllTx();
    }
    return this.buildSellTx();
  }

  private async buildBuyTx(): Promise<Tx> {
    const { amountIn, amountOut, swaps } = this.trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];
    const slippage = math.getFraction(amountIn, this.slippagePct);

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;
    const maxAmountIn = amountIn + slippage;

    let tx: Transaction;

    if (this.isDirectOmnipoolTrade(swaps)) {
      tx = this.api.tx.Omnipool.buy({
        asset_in: assetIn,
        asset_out: assetOut,
        amount: amountOut,
        max_sell_amount: maxAmountIn,
      });
    } else {
      tx = this.api.tx.Router.buy({
        asset_in: assetIn,
        asset_out: assetOut,
        amount_out: amountOut,
        max_amount_in: maxAmountIn,
        route: TradeRouteBuilder.build(swaps) as any,
      });
    }
    return this.wrapTx('RouterBuy', tx);
  }

  private async buildSellTx(): Promise<Tx> {
    const { amountIn, amountOut, swaps } = this.trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];
    const slippage = math.getFraction(amountOut, this.slippagePct);

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;
    const minAmountOut = amountOut - slippage;

    let tx: Transaction;

    if (this.isDirectOmnipoolTrade(swaps)) {
      tx = this.api.tx.Omnipool.sell({
        asset_in: assetIn,
        asset_out: assetOut,
        amount: amountIn,
        min_buy_amount: minAmountOut,
      });
    } else {
      tx = this.api.tx.Router.sell({
        asset_in: assetIn,
        asset_out: assetOut,
        amount_in: amountIn,
        min_amount_out: minAmountOut,
        route: TradeRouteBuilder.build(swaps) as any,
      });
    }

    if (firstSwap.isWithdraw()) {
      const hasDebt = await this.aaveUtils.hasBorrowPositions(this.beneficiary);
      if (hasDebt) {
        tx = await this.dispatchWithExtraGas(tx);
      }
    }

    return this.wrapTx('RouterSell', tx);
  }

  private async buildSellAllTx(): Promise<Tx> {
    const { amountOut, swaps } = this.trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];
    const slippage = math.getFraction(amountOut, this.slippagePct);

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;
    const minAmountOut = amountOut - slippage;

    let tx: Transaction = this.api.tx.Router.sell_all({
      asset_in: assetIn,
      asset_out: assetOut,
      min_amount_out: minAmountOut,
      route: TradeRouteBuilder.build(swaps) as any,
    });

    if (firstSwap.isWithdraw()) {
      const hasDebt = await this.aaveUtils.hasBorrowPositions(this.beneficiary);
      if (hasDebt) {
        tx = await this.dispatchWithExtraGas(tx);
      }
    }

    return this.wrapTx('RouterSellAll', tx);
  }
}
