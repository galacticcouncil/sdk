import { Enum, PolkadotClient } from 'polkadot-api';

import { Papi, SubstrateTransaction, Tx } from '../api';
import { math } from '../utils';
import { BalanceClient } from '../client';
import { AAVE_GAS_LIMIT, AaveUtils } from '../aave';
import { EvmClient } from '../evm';
import { PoolType } from '../pool';

import { Swap, Trade, TradeOrder, TradeOrderType, TradeType } from './types';
import { TradeRouteBuilder, TradeValidator } from './utils';

export class TxBuilder extends Papi {
  private evmClient: EvmClient;

  private balanceClient: BalanceClient;
  private aaveUtils: AaveUtils;

  constructor(client: PolkadotClient, evmClient?: EvmClient) {
    super(client);
    this.evmClient = evmClient ?? new EvmClient();
    this.aaveUtils = new AaveUtils(this.evmClient);
    this.balanceClient = new BalanceClient(client);
  }

  private async buildBuyTx(
    trade: Trade,
    slippagePct = 1
  ): Promise<SubstrateTransaction> {
    TradeValidator.ensureType(trade, TradeType.Buy);

    const { amountIn, amountOut, swaps } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];
    const slippage = math.getFraction(amountIn, slippagePct);

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;
    const maxAmountIn = amountIn + slippage;

    let tx: Tx;

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

  private async buildSellTx(
    trade: Trade,
    beneficiary: string,
    slippagePct = 1
  ): Promise<SubstrateTransaction> {
    TradeValidator.ensureType(trade, TradeType.Sell);

    const { amountIn, amountOut, swaps } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];
    const slippage = math.getFraction(amountOut, slippagePct);

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;
    const minAmountOut = amountOut - slippage;

    let tx: Tx;

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
      const hasDebt = await this.aaveUtils.hasBorrowPositions(beneficiary);
      if (hasDebt) {
        tx = await this.dispatchWithExtraGas(tx);
      }
    }

    return this.wrapTx('RouterSell', tx);
  }

  private async buildSellAllTx(
    trade: Trade,
    beneficiary: string,
    slippagePct = 1
  ): Promise<SubstrateTransaction> {
    TradeValidator.ensureType(trade, TradeType.Sell);

    const { amountOut, swaps } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];
    const slippage = math.getFraction(amountOut, slippagePct);

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;
    const minAmountOut = amountOut - slippage;

    let tx: Tx = this.api.tx.Router.sell_all({
      asset_in: assetIn,
      asset_out: assetOut,
      min_amount_out: minAmountOut,
      route: TradeRouteBuilder.build(swaps) as any,
    });

    if (firstSwap.isWithdraw()) {
      const hasDebt = await this.aaveUtils.hasBorrowPositions(beneficiary);
      if (hasDebt) {
        tx = await this.dispatchWithExtraGas(tx);
      }
    }

    return this.wrapTx('RouterSellAll', tx);
  }

  async buildTradeTx(
    trade: Trade,
    beneficiary: string,
    slippagePct = 1
  ): Promise<SubstrateTransaction> {
    const { amountIn, swaps, type } = trade;

    if (type === TradeType.Buy) {
      return this.buildBuyTx(trade, slippagePct);
    }

    const { assetIn } = swaps[0];

    const balance = await this.balanceClient.getBalance(beneficiary, assetIn);
    const isMax = amountIn >= balance - 5n;

    if (isMax) {
      return this.buildSellAllTx(trade, beneficiary, slippagePct);
    }
    return this.buildSellTx(trade, beneficiary, slippagePct);
  }

  protected buildDcaTx(
    order: TradeOrder,
    beneficiary: string,
    maxRetries: number,
    slippagePct = 1
  ): SubstrateTransaction {
    TradeValidator.ensureOrderType(order, TradeOrderType.Dca);

    const {
      amountIn,
      assetIn,
      assetOut,
      tradeAmountIn,
      tradePeriod,
      tradeRoute,
    } = order;

    const tx: Tx = this.api.tx.DCA.schedule({
      schedule: {
        owner: beneficiary,
        period: tradePeriod,
        max_retries: maxRetries,
        total_amount: amountIn,
        slippage: Number(slippagePct) * 10000,
        order: Enum('Sell', {
          asset_in: assetIn,
          asset_out: assetOut,
          amount_in: tradeAmountIn,
          min_amount_out: 0n,
          route: tradeRoute as any,
        }),
      },
      start_execution_block: undefined,
    });

    return this.wrapTx('DcaSchedule', tx);
  }

  protected buildTwapSellTx(
    order: TradeOrder,
    beneficiary: string,
    maxRetries: number,
    slippagePct = 1
  ): SubstrateTransaction {
    TradeValidator.ensureOrderType(order, TradeOrderType.TwapSell);

    const {
      amountIn,
      assetIn,
      assetOut,
      tradeAmountIn,
      tradeAmountOut,
      tradePeriod,
      tradeRoute,
    } = order;

    const slippage = math.getFraction(tradeAmountOut, slippagePct);
    const minAmountOut = tradeAmountOut - slippage;

    const tx: Tx = this.api.tx.DCA.schedule({
      schedule: {
        owner: beneficiary,
        period: tradePeriod,
        max_retries: maxRetries,
        total_amount: amountIn,
        slippage: Number(slippagePct) * 10000,
        order: Enum('Sell', {
          asset_in: assetIn,
          asset_out: assetOut,
          amount_in: tradeAmountIn,
          min_amount_out: minAmountOut,
          route: tradeRoute as any,
        }),
      },
      start_execution_block: undefined,
    });

    return this.wrapTx('DcaSchedule.twapSell', tx);
  }

  protected buildTwapBuyTx(
    order: TradeOrder,
    beneficiary: string,
    maxRetries: number,
    slippagePct = 1
  ): SubstrateTransaction {
    TradeValidator.ensureOrderType(order, TradeOrderType.TwapBuy);

    const {
      amountIn,
      assetIn,
      assetOut,
      tradeAmountIn,
      tradeAmountOut,
      tradePeriod,
      tradeRoute,
    } = order;

    const slippage = math.getFraction(tradeAmountIn, slippagePct);
    const maxAmountIn = tradeAmountIn + slippage;

    const tx: Tx = this.api.tx.DCA.schedule({
      schedule: {
        owner: beneficiary,
        period: tradePeriod,
        max_retries: maxRetries,
        total_amount: amountIn,
        slippage: Number(slippagePct) * 10000,
        order: Enum('Buy', {
          asset_in: assetIn,
          asset_out: assetOut,
          amount_out: tradeAmountOut,
          max_amount_in: maxAmountIn,
          route: tradeRoute as any,
        }),
      },
      start_execution_block: undefined,
    });

    return this.wrapTx('DcaSchedule.twapBuy', tx);
  }

  buildOrderTx(
    order: TradeOrder,
    beneficiary: string,
    maxRetries: number,
    slippagePct = 1
  ): SubstrateTransaction {
    switch (order.type) {
      case TradeOrderType.Dca:
        return this.buildDcaTx(order, beneficiary, maxRetries, slippagePct);
      case TradeOrderType.TwapSell:
        return this.buildTwapSellTx(
          order,
          beneficiary,
          maxRetries,
          slippagePct
        );
      case TradeOrderType.TwapBuy:
        return this.buildTwapBuyTx(order, beneficiary, maxRetries, slippagePct);
      default:
        throw new Error(`Unsupported TradeOrderType: ${order.type}`);
    }
  }

  private wrapTx(name: string, tx: Tx): SubstrateTransaction {
    return {
      name,
      get: () => tx,
      dryRun: (account: string) => {
        throw Error('Not supported');
      },
    };
  }

  private async dispatchWithExtraGas(tx: Tx): Promise<Tx> {
    const hex = await tx.getEncodedData();
    const call = Enum('EncodedCall', hex);
    return this.api.tx.Dispatcher.dispatch_with_extra_gas({
      call: call,
      extra_gas: AAVE_GAS_LIMIT,
    });
  }

  private isDirectOmnipoolTrade(swaps: Swap[]): boolean {
    return swaps.length === 1 && swaps[0].pool === PoolType.Omni;
  }
}
