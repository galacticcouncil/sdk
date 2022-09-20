import { BigNumber } from './utils/bignumber';

export type PoolAsset = { token: string; symbol: string };

export enum PoolType {
  XYK = 'XYK',
  LBP = 'LBP',
  Stable = 'Stable',
  Omni = 'Omni',
}

export interface PoolPair {
  tokenIn: string;
  tokenOut: string;
  decimalsIn: number;
  decimalsOut: number;
  balanceIn: BigNumber;
  balanceOut: BigNumber;
}

export type PoolBase = {
  address: string;
  type: PoolType;
  tradeFee: PoolFee;
  tokens: PoolToken[];

  // LBP specific fields
  repayFee?: PoolFee;
  repayFeeApply?: boolean;
};

export type PoolFee = [numerator: number, denominator: number];

export type PoolToken = {
  id: string;
  balance: string;
  decimals: number;
  symbol: string;
};

export interface Pool extends PoolBase {
  validPair(tokenIn: string, tokenOut: string): boolean;
  parsePoolPair(tokenIn: string, tokenOut: string): PoolPair;
  calculateInGivenOut(poolPair: PoolPair, amountOut: BigNumber): BigNumber;
  calculateOutGivenIn(poolPair: PoolPair, amountIn: BigNumber): BigNumber;
  calculateTradeFee(amount: BigNumber): BigNumber;
  getSpotPriceIn(poolPair: PoolPair): BigNumber;
  getSpotPriceOut(poolPair: PoolPair): BigNumber;
}

export interface PoolService {
  getPools(): Promise<PoolBase[]>;
}

export type Hop = {
  poolType: PoolType;
  poolId: string;
  tokenIn: string;
  tokenOut: string;
};

export type Swap = Humanizer &
  Hop & {
    tokenInDecimals: number;
    tokenOutDecimals: number;
    amountIn: BigNumber;
    amountOut: BigNumber;
    finalAmount: BigNumber;
    tradeFee: BigNumber;
    spotPrice: BigNumber;
    priceImpactPct: BigNumber;
  };

export type SellSwap = Swap & {
  calculatedOut: BigNumber;
};

export type BuySwap = Swap & {
  calculatedIn: BigNumber;
};

export enum TradeType {
  Buy = 'Buy',
  Sell = 'Sell',
}

export type Trade = Humanizer & {
  type: TradeType;
  amountIn: BigNumber;
  amountOut: BigNumber;
  spotPrice: BigNumber;
  priceImpactPct: BigNumber;
  swaps: Swap[];
};

export interface Humanizer {
  toHuman(): any;
}

export interface Amount {
  amount: BigNumber;
  decimals: number;
}
