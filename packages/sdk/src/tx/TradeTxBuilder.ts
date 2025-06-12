import { SubmittableExtrinsic } from '@polkadot/api/promise/types';

import { encodeFunctionData } from 'viem';

import {
  AAVE_GAS_LIMIT,
  AAVE_POOL_ABI,
  AAVE_POOL_PROXY,
  AAVE_UINT_256_MAX,
} from '../aave';
import { Trade, TradeRouteBuilder, TradeType } from '../sor';
import { BigNumber } from '../utils/bignumber';
import { ERC20 } from '../utils/erc20';
import { H160 } from '../utils/h160';
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

    const firstSwap = swaps[0];
    const { assetIn, assetOut } = firstSwap;

    const balance = await this.balanceClient.getBalance(
      this.beneficiary,
      assetIn
    );
    const maxThreshold = balance.minus(5);

    let canSellAll = true;
    if (firstSwap.isWithdraw()) {
      const maxWithdraw = await this.aaveUtils.getMaxWithdraw(
        this.beneficiary,
        assetOut
      );
      canSellAll = maxWithdraw.amount.isGreaterThanOrEqualTo(maxThreshold);
    }

    const isMax = canSellAll && amountIn.isGreaterThanOrEqualTo(maxThreshold);
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

  private async buildSellTx(): Promise<SubstrateTransaction> {
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

  private async buildSellAllTx(): Promise<SubstrateTransaction> {
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

  private async buildWithdrawTx(
    max?: BigNumber
  ): Promise<SubstrateTransaction> {
    const { swaps } = this.trade;

    const amountIn = max || this.trade.amountIn;

    const firstSwap = swaps[0];
    const reserve = firstSwap.assetOut;

    const gasPrice = await this.evmClient.getGasPrice();
    const gasPriceMargin = (gasPrice * 10n) / 100n;

    const to = H160.fromAny(this.beneficiary);
    const amount = max ? AAVE_UINT_256_MAX : BigInt(amountIn.toFixed());
    const asset = ERC20.fromAssetId(reserve);

    const withdrawCalldata = encodeFunctionData({
      abi: AAVE_POOL_ABI,
      functionName: 'withdraw',
      args: [asset as `0x${string}`, amount, to as `0x${string}`],
    });

    const withdrawTx: SubmittableExtrinsic = this.api.tx.evm.call(
      to,
      AAVE_POOL_PROXY,
      withdrawCalldata,
      0n,
      AAVE_GAS_LIMIT,
      gasPrice + gasPriceMargin,
      gasPrice + gasPriceMargin,
      null,
      []
    );

    return {
      hex: withdrawTx.toHex(),
      name: 'Withdraw',
      get: () => withdrawTx,
      dryRun: (account: string) => this.dryRun(account, withdrawTx),
    } as SubstrateTransaction;
  }
}
