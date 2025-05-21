import { SubstrateTransaction } from '../api';
import { Hop, PoolBuy, PoolError, PoolSell, PoolType } from '../pool';
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

export type TradeRoute = {
  pool: PoolType | { Stableswap: string };
  assetIn: string;
  assetOut: string;
};

export interface Trade extends Humanizer {
  type: TradeType;
  amountIn: BigNumber;
  amountOut: BigNumber;
  spotPrice: BigNumber;
  tradeFee: BigNumber;
  tradeFeePct: number;
  priceImpactPct: number;
  swaps: Swap[];
  toTx(slippagePct?: number): SubstrateTransaction;
}

export interface TradeOrder extends Humanizer {
  amountIn: BigNumber;
  assetIn: string;
  assetOut: string;
  errors: TradeOrderError[];
  tradeAmountIn: BigNumber;
  tradeAmountOut: BigNumber;
  tradeCount: number;
  tradePeriod: number;
  tradeRoute: TradeRoute[];
  toTx(
    beneficiary: string,
    maxRetries: number,
    slippagePct?: number
  ): SubstrateTransaction;
}

export interface TradeDcaOrder extends TradeOrder {
  frequency: number;
  frequencyMin: number;
  frequencyOpt: number;
}

export interface TradeTwapOrder extends TradeOrder {
  amountOut: BigNumber;
  priceImpactPct: number;
  tradeFee: BigNumber;
  tradeType: TradeType;
}

export enum TradeOrderError {
  OrderTooSmall = 'OrderTooSmall',
  OrderTooBig = 'OrderTooBig',
  OrderImpactTooBig = 'OrderImpactTooBig',
}
