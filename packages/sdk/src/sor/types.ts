import type { Hop, PoolBuy, PoolError, PoolSell } from '../pool';
import type { BigNumber } from '../utils/bignumber';

export interface Humanizer {
  toHuman(): any;
}

export type Swap = Hop &
  Humanizer & {
    assetInDecimals: number;
    assetOutDecimals: number;
    amountIn: BigNumber;
    amountOut: BigNumber;
    spotPrice: BigNumber;
    tradeFeePct: number;
    tradeFeeRange?: [number, number];
    priceImpactPct: number;
    errors: PoolError[];
    isSupply(): boolean;
    isWithdraw(): boolean;
  };

export type SellSwap = Swap & PoolSell;
export type BuySwap = Swap & PoolBuy;

export enum TradeType {
  Buy = 'Buy',
  Sell = 'Sell',
}

export interface Trade extends Humanizer {
  type: TradeType;
  amountIn: BigNumber;
  amountOut: BigNumber;
  spotPrice: BigNumber;
  tradeFee: BigNumber;
  tradeFeePct: number;
  priceImpactPct: number;
  swaps: Swap[];
}
