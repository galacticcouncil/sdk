import { ApiPromise } from '@polkadot/api';
import { CallDryRunEffects } from '@polkadot/types/interfaces';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';

import { PolkadotApiClient } from '../api';
import { Hop, PoolType } from '../pool';
import { getFraction } from '../utils/math';

import { Trade, TradeType, Transaction } from './types';

export class TradeUtils extends PolkadotApiClient {
  constructor(api: ApiPromise) {
    super(api);
  }

  buildBuyTx(trade: Trade, slippagePct = 1): Transaction {
    if (trade.type !== TradeType.Buy) throw new Error('Not permitted');

    const { amountIn, amountOut, swaps } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const slippage = getFraction(amountIn, slippagePct);

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;
    const maxAmountIn = amountIn.plus(slippage);

    let tx: SubmittableExtrinsic;

    if (this.isDirectOmnipoolTrade(trade)) {
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
        this.buildRoute(trade)
      );
    }

    return {
      hex: tx.toHex(),
      name: 'RouterBuy',
      get: () => tx,
      dryRun: (account: string) => this.dryRun(account, tx),
    } as Transaction;
  }

  buildSellTx(trade: Trade, slippagePct = 1): Transaction {
    if (trade.type !== TradeType.Sell) throw new Error('Not permitted');

    const { amountIn, amountOut, swaps } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const slippage = getFraction(amountOut, slippagePct);

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;
    const minAmountOut = amountOut.minus(slippage);

    let tx: SubmittableExtrinsic;

    if (this.isDirectOmnipoolTrade(trade)) {
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
        this.buildRoute(trade)
      );
    }

    return {
      hex: tx.toHex(),
      name: 'RouterSell',
      get: () => tx,
      dryRun: (account: string) => this.dryRun(account, tx),
    } as Transaction;
  }

  buildSellAllTx(trade: Trade, slippagePct = 1): Transaction {
    if (trade.type !== TradeType.Sell) throw new Error('Not permitted');

    const { amountOut, swaps } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const slippage = getFraction(amountOut, slippagePct);

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;
    const minAmountOut = amountOut.minus(slippage);

    const tx: SubmittableExtrinsic = this.api.tx.router.sellAll(
      assetIn,
      assetOut,
      minAmountOut.toFixed(),
      this.buildRoute(trade)
    );

    return {
      hex: tx.toHex(),
      name: 'RouterSellAll',
      get: () => tx,
      dryRun: (account: string) => this.dryRun(account, tx),
    } as Transaction;
  }

  async dryRun(
    account: string,
    extrinsic: SubmittableExtrinsic
  ): Promise<CallDryRunEffects> {
    let result;
    try {
      result = await this.api.call.dryRunApi.dryRunCall(
        {
          System: { Signed: account },
        },
        extrinsic.inner.toHex()
      );
    } catch (e) {
      console.error(e);
      throw new Error('Dry run execution failed!');
    }

    if (result.isOk) {
      return result.asOk;
    }
    console.log(result.asErr.toHuman());
    throw new Error('Dry run execution error!');
  }

  buildRoute(trade: Trade) {
    const { swaps } = trade;

    return swaps.map(({ assetIn, assetOut, pool, poolId }: Hop) => {
      if (pool === PoolType.Stable) {
        return {
          pool: {
            Stableswap: poolId,
          },
          assetIn,
          assetOut,
        };
      }
      return {
        pool,
        assetIn,
        assetOut,
      };
    });
  }

  isDirectOmnipoolTrade(trade: Trade): boolean {
    const { swaps } = trade;
    return swaps.length === 1 && swaps[0].pool === PoolType.Omni;
  }
}
