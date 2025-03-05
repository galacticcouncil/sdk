import type { Hop, PoolBuy, PoolError, PoolSell } from '../pool';

type Override<T1, T2> = Omit<T1, keyof T2> & T2;

export interface Humanizer {
  toHuman(): any;
}

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

/* export interface TradeHuman
  extends Override<
    Trade,
    { amountIn: string; amountOut: string; spotPrice: string; tradeFee: string }
  > {}
 */
