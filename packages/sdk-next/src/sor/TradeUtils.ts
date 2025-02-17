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

  async buildTx(trade: Trade, slippage = 1): Promise<Binary> {
    switch (trade.type) {
      case TradeType.Sell:
        return this.buildSellTx(trade, slippage);
      case TradeType.Buy:
        return this.buildBuyTx(trade, slippage);
      default:
        throw Error('Unsupported trade type', trade.type);
    }
  }

  private async buildBuyTx(trade: Trade, slippagePct = 1): Promise<Binary> {
    const { amountIn, amountOut, swaps } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];
    const slippage = math.multiplyByFraction(amountIn, slippagePct);

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

  private async buildSellTx(trade: Trade, slippagePct = 1): Promise<Binary> {
    const { amountIn, amountOut, swaps } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];
    const slippage = math.multiplyByFraction(amountOut, slippagePct);

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
