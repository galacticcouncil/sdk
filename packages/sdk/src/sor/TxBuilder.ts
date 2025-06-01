import { ApiPromise } from '@polkadot/api';
import { type SubmittableExtrinsic } from '@polkadot/api/promise/types';

import { PolkadotApiClient, SubstrateTransaction } from '../api';
import { BalanceClient } from '../client';
import { AAVE_GAS_LIMIT, AaveUtils } from '../aave';
import { EvmClient } from '../evm';
import { PoolType } from '../pool';
import { getFraction } from '../utils/math';

import { Swap, Trade, TradeOrder, TradeOrderType, TradeType } from './types';
import { TradeRouteBuilder, TradeValidator } from './utils';

export class TxBuilder extends PolkadotApiClient {
  private evmClient: EvmClient;

  private balanceClient: BalanceClient;
  private aaveUtils: AaveUtils;

  constructor(api: ApiPromise, evmClient?: EvmClient) {
    super(api);
    this.evmClient = evmClient ?? new EvmClient();
    this.aaveUtils = new AaveUtils(this.evmClient);
    this.balanceClient = new BalanceClient(api);
  }

  private buildBuyTx(trade: Trade, slippagePct = 1): SubstrateTransaction {
    TradeValidator.ensureType(trade, TradeType.Buy);

    const { amountIn, amountOut, swaps } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const slippage = getFraction(amountIn, slippagePct);

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

  protected async buildSellTx(
    trade: Trade,
    beneficiary: string,
    slippagePct = 1
  ): Promise<SubstrateTransaction> {
    TradeValidator.ensureType(trade, TradeType.Sell);

    const { amountIn, amountOut, swaps } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const slippage = getFraction(amountOut, slippagePct);

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
      const hasDebt = await this.aaveUtils.hasBorrowPositions(beneficiary);
      if (hasDebt) {
        tx = this.dispatchWithExtraGas(tx);
      }
    }

    return this.wrapTx('RouterSell', tx);
  }

  protected async buildSellAllTx(
    trade: Trade,
    beneficiary: string,
    slippagePct = 1
  ): Promise<SubstrateTransaction> {
    TradeValidator.ensureType(trade, TradeType.Sell);

    const { amountOut, swaps } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const slippage = getFraction(amountOut, slippagePct);

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
      const hasDebt = await this.aaveUtils.hasBorrowPositions(beneficiary);
      if (hasDebt) {
        tx = this.dispatchWithExtraGas(tx);
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
    const isMax = amountIn.isGreaterThanOrEqualTo(balance.minus(5));

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

    const tx: SubmittableExtrinsic = this.api.tx.dca.schedule(
      {
        owner: beneficiary,
        period: tradePeriod,
        maxRetries,
        totalAmount: amountIn.toFixed(),
        slippage: Number(slippagePct) * 10000,
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

    const slippage = getFraction(tradeAmountOut, slippagePct);
    const minAmountOut = tradeAmountOut.minus(slippage);

    const tx: SubmittableExtrinsic = this.api.tx.dca.schedule(
      {
        owner: beneficiary,
        period: tradePeriod,
        maxRetries,
        totalAmount: amountIn.toFixed(),
        slippage: Number(slippagePct) * 10000,
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

    const slippage = getFraction(tradeAmountIn, slippagePct);
    const maxAmountIn = tradeAmountIn.plus(slippage);

    const tx: SubmittableExtrinsic = this.api.tx.dca.schedule(
      {
        owner: beneficiary,
        period: tradePeriod,
        maxRetries,
        totalAmount: amountIn.toFixed(),
        slippage: Number(slippagePct) * 10000,
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

  private wrapTx(name: string, tx: SubmittableExtrinsic): SubstrateTransaction {
    return {
      hex: tx.toHex(),
      name,
      get: () => tx,
      dryRun: (account: string) => this.dryRun(account, tx),
    };
  }

  private dispatchWithExtraGas(tx: SubmittableExtrinsic): SubmittableExtrinsic {
    return this.api.tx.dispatcher['dispatchWithExtraGas'](
      tx.inner.toHex(),
      AAVE_GAS_LIMIT
    );
  }

  private isDirectOmnipoolTrade(swaps: Swap[]): boolean {
    return swaps.length === 1 && swaps[0].pool === PoolType.Omni;
  }
}
