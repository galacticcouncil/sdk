import { SubmittableExtrinsic } from '@polkadot/api/promise/types';

import { Trade, TradeRouteBuilder, TradeType } from '../sor';
import { getFraction } from '../utils/math';

import { TxBuilder } from './TxBuilder';
import { SubstrateTransaction } from './types';

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

  async build(): Promise<SubstrateTransaction> {
    const { amountIn, swaps, type } = this.trade;

    if (type === TradeType.Buy) {
      return this.buildBuyTx();
    }

    const { assetIn } = swaps[0];

    const balance = await this.balanceClient.getBalance(
      this.beneficiary,
      assetIn
    );
    const isMax = amountIn.isGreaterThanOrEqualTo(balance.minus(5));

    if (isMax) {
      return this.buildSellAllTx();
    }
    return this.buildSellTx();
  }

  private buildBuyTx(): SubstrateTransaction {
    const { amountIn, amountOut, swaps } = this.trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const slippage = getFraction(amountIn, this.slippagePct);

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;
    const maxAmountIn = amountIn.plus(slippage);

    let tx: SubmittableExtrinsic;

    if (this.isDirectOmnipoolTrade(swaps)) {
      tx = this.api.tx.omnipool.buy(
        assetOut,
        assetIn,
        amountOut.toFixed(),
        maxAmountIn.toFixed()
      );
    } else {
      tx = this.api.tx.router.buy(
        assetIn,
        assetOut,
        amountOut.toFixed(),
        maxAmountIn.toFixed(),
        TradeRouteBuilder.build(swaps)
      );
    }

    return this.wrapTx('RouterBuy', tx);
  }

  protected async buildSellTx(): Promise<SubstrateTransaction> {
    const { amountIn, amountOut, swaps } = this.trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const slippage = getFraction(amountOut, this.slippagePct);

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;
    const minAmountOut = amountOut.minus(slippage);

    let tx: SubmittableExtrinsic;

    if (this.isDirectOmnipoolTrade(swaps)) {
      tx = this.api.tx.omnipool.sell(
        assetIn,
        assetOut,
        amountIn.toFixed(),
        minAmountOut.toFixed()
      );
    } else {
      tx = this.api.tx.router.sell(
        assetIn,
        assetOut,
        amountIn.toFixed(),
        minAmountOut.toFixed(),
        TradeRouteBuilder.build(swaps)
      );
    }

    if (firstSwap.isWithdraw()) {
      const hasDebt = await this.aaveUtils.hasBorrowPositions(this.beneficiary);
      if (hasDebt) {
        tx = this.dispatchWithExtraGas(tx);
      }
    }

    return this.wrapTx('RouterSell', tx);
  }

  protected async buildSellAllTx(): Promise<SubstrateTransaction> {
    const { amountOut, swaps } = this.trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const slippage = getFraction(amountOut, this.slippagePct);

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;
    const minAmountOut = amountOut.minus(slippage);

    let tx: SubmittableExtrinsic = this.api.tx.router.sellAll(
      assetIn,
      assetOut,
      minAmountOut.toFixed(),
      TradeRouteBuilder.build(swaps)
    );

    if (firstSwap.isWithdraw()) {
      const hasDebt = await this.aaveUtils.hasBorrowPositions(this.beneficiary);
      if (hasDebt) {
        tx = this.dispatchWithExtraGas(tx);
      }
    }

    return this.wrapTx('RouterSellAll', tx);
  }
}
