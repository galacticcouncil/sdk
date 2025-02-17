import type { Hop, PoolBuy, PoolError, PoolSell } from '../pool';
import type { Humanizer } from '../types';

export type Swap = Hop &
  Humanizer & {
    assetInDecimals: number;
    assetOutDecimals: number;
    amountIn: bigint;
    amountOut: bigint;
    spotPrice: bigint;
    tradeFeePct: number;
    tradeFeeRange?: [number, number];
    priceImpactPct: number;
    errors: PoolError[];
  };

export type SellSwap = Swap & PoolSell;
export type BuySwap = Swap & PoolBuy;

export enum TradeType {
  Buy = 'Buy',
  Sell = 'Sell',
}

export interface Trade extends Humanizer {
  type: TradeType;
  amountIn: bigint;
  amountOut: bigint;
  spotPrice: bigint;
  tradeFee: bigint;
  tradeFeePct: number;
  priceImpactPct: number;
  swaps: Swap[];
}
