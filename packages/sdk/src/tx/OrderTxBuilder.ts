import { SubmittableExtrinsic } from '@polkadot/api/promise/types';

import { TradeOrder, TradeOrderType } from '../sor';
import { getFraction } from '../utils/math';

import { TxBuilder } from './TxBuilder';
import { SubstrateTransaction } from './types';

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

  async build(): Promise<SubstrateTransaction> {
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

  private buildDcaTx(): SubstrateTransaction {
    const {
      amountIn,
      assetIn,
      assetOut,
      tradeAmountIn,
      tradePeriod,
      tradeRoute,
    } = this.order;

    const tx: SubmittableExtrinsic = this.api.tx.dca.schedule(
      {
        owner: this.beneficiary,
        period: tradePeriod,
        maxRetries: this.maxRetries,
        totalAmount: amountIn.toFixed(),
        slippage: this.slippagePct * 10000,
        order: {
          Sell: {
            assetIn: assetIn,
            assetOut: assetOut,
            amountIn: tradeAmountIn.toFixed(),
            minAmountOut: '0',
            route: tradeRoute,
          },
        },
      },
      null
    );

    return this.wrapTx('DcaSchedule', tx);
  }

  private buildTwapSellTx(): SubstrateTransaction {
    const {
      amountIn,
      assetIn,
      assetOut,
      tradeAmountIn,
      tradeAmountOut,
      tradePeriod,
      tradeRoute,
    } = this.order;

    const slippage = getFraction(tradeAmountOut, this.slippagePct);
    const minAmountOut = tradeAmountOut.minus(slippage);

    const tx: SubmittableExtrinsic = this.api.tx.dca.schedule(
      {
        owner: this.beneficiary,
        period: tradePeriod,
        maxRetries: this.maxRetries,
        totalAmount: amountIn.toFixed(),
        slippage: this.slippagePct * 10000,
        order: {
          Sell: {
            assetIn: assetIn,
            assetOut: assetOut,
            amountIn: tradeAmountIn.toFixed(),
            minAmountOut: minAmountOut.toFixed(),
            route: tradeRoute,
          },
        },
      },
      null
    );

    return this.wrapTx('DcaSchedule.twapSell', tx);
  }

  private buildTwapBuyTx(): SubstrateTransaction {
    const {
      amountIn,
      assetIn,
      assetOut,
      tradeAmountIn,
      tradeAmountOut,
      tradePeriod,
      tradeRoute,
    } = this.order;

    const slippage = getFraction(tradeAmountIn, this.slippagePct);
    const maxAmountIn = tradeAmountIn.plus(slippage);

    const tx: SubmittableExtrinsic = this.api.tx.dca.schedule(
      {
        owner: this.beneficiary,
        period: tradePeriod,
        maxRetries: this.maxRetries,
        totalAmount: amountIn.toFixed(),
        slippage: this.slippagePct * 10000,
        order: {
          Buy: {
            assetIn: assetIn,
            assetOut: assetOut,
            amountOut: tradeAmountOut.toFixed(),
            maxAmountIn: maxAmountIn.toFixed(),
            route: tradeRoute,
          },
        },
      },
      null
    );

    return this.wrapTx('DcaSchedule.twapBuy', tx);
  }
}
