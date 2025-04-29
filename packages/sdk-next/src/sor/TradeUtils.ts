import { Binary, Enum, PolkadotClient } from 'polkadot-api';

import { Papi } from '../api';
import { math } from '../utils';
import { Hop, PoolType } from '../pool';

import { Swap, Trade, TradeType } from './types';

export class TradeUtils extends Papi {
  constructor(client: PolkadotClient) {
    super(client);
  }

  private isDirectOmnipoolTrade(swaps: Swap[]): boolean {
    return swaps.length === 1 && swaps[0].pool === PoolType.Omni;
  }

  private tradeCheck(trade: Trade, tradeType: TradeType) {
    if (tradeType !== trade.type) {
      throw new Error('Not permitted');
    }
  }

  async buildBuyTx(trade: Trade, slippagePct = 1): Promise<Binary> {
    this.tradeCheck(trade, TradeType.Buy);

    const { amountIn, amountOut, swaps } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];
    const slippage = math.getFraction(amountIn, slippagePct);

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;
    const maxAmountIn = amountIn + slippage;

    if (this.isDirectOmnipoolTrade(swaps)) {
      const tx = this.api.tx.Omnipool.buy({
        asset_in: assetIn,
        asset_out: assetOut,
        amount: amountOut,
        max_sell_amount: maxAmountIn,
      });
      return tx.getEncodedData();
    }
    const tx = this.api.tx.Router.buy({
      asset_in: assetIn,
      asset_out: assetOut,
      amount_out: amountOut,
      max_amount_in: maxAmountIn,
      route: this.buildRoute(swaps),
    });
    return tx.getEncodedData();
  }

  async buildSellTx(trade: Trade, slippagePct = 1): Promise<Binary> {
    this.tradeCheck(trade, TradeType.Sell);

    const { amountIn, amountOut, swaps } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];
    const slippage = math.getFraction(amountOut, slippagePct);

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;
    const minAmountOut = amountOut - slippage;

    if (this.isDirectOmnipoolTrade(swaps)) {
      const tx = this.api.tx.Omnipool.sell({
        asset_in: assetIn,
        asset_out: assetOut,
        amount: amountIn,
        min_buy_amount: minAmountOut,
      });
      return tx.getEncodedData();
    }

    const tx = this.api.tx.Router.sell({
      asset_in: assetIn,
      asset_out: assetOut,
      amount_in: amountIn,
      min_amount_out: minAmountOut,
      route: this.buildRoute(swaps),
    });
    return tx.getEncodedData();
  }

  async buildSellAllTx(trade: Trade, slippagePct = 1): Promise<Binary> {
    this.tradeCheck(trade, TradeType.Sell);

    const { amountOut, swaps } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];
    const slippage = math.getFraction(amountOut, slippagePct);

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;
    const minAmountOut = amountOut - slippage;

    const tx = this.api.tx.Router.sell_all({
      asset_in: assetIn,
      asset_out: assetOut,
      min_amount_out: minAmountOut,
      route: this.buildRoute(swaps),
    });
    return tx.getEncodedData();
  }

  private buildRoute(swaps: Swap[]) {
    return swaps.map(({ assetIn, assetOut, pool, poolId }: Hop) => {
      if (pool === PoolType.Stable) {
        return {
          pool: Enum('Stableswap', poolId),
          asset_in: assetIn,
          asset_out: assetOut,
        };
      }
      return {
        pool: Enum(pool),
        asset_in: assetIn,
        asset_out: assetOut,
      };
    });
  }
}
