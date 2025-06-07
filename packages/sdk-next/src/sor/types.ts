import { Enum } from 'polkadot-api';

import type { Hop, PoolBuy, PoolError, PoolSell } from '../pool';

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
    isSupply(): boolean;
    isWithdraw(): boolean;
  };

export type SellSwap = Swap & PoolSell;
export type BuySwap = Swap & PoolBuy;

export interface Trade extends Humanizer {
  type: TradeType;
  amountIn: bigint;
  amountOut: bigint;
  spotPrice: bigint;
  tradeFee: bigint;
  tradeFeePct: number;
  tradeFeeRange?: [number, number];
  priceImpactPct: number;
  swaps: Swap[];
}

export enum TradeType {
  Buy = 'Buy',
  Sell = 'Sell',
}

export type TradeRoute = {
  pool: ReturnType<typeof Enum>;
  asset_in: number;
  asset_out: number;
};

export interface TradeOrder extends Humanizer {
  amountIn: bigint;
  amountOut: bigint;
  assetIn: number;
  assetOut: number;
  errors: TradeOrderError[];
  tradeAmountIn: bigint;
  tradeAmountOut: bigint;
  tradeCount: number;
  tradeFee: bigint;
  tradeImpactPct: number;
  tradePeriod: number;
  tradeRoute: TradeRoute[];
  type: TradeOrderType;
}

export enum TradeOrderType {
  Dca = 'Dca',
  TwapSell = 'TwapSell',
  TwapBuy = 'TwapBuy',
}

export enum TradeOrderError {
  OrderTooSmall = 'OrderTooSmall',
  OrderTooBig = 'OrderTooBig',
  OrderImpactTooBig = 'OrderImpactTooBig',
}

export interface TradeDcaOrder extends TradeOrder {
  frequency: number;
  frequencyMin: number;
  frequencyOpt: number;
}
