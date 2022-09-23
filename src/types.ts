import { BigNumber } from './utils/bignumber';

export type PoolAsset = { token: string; symbol: string };

export enum PoolType {
  XYK = 'XYK',
  LBP = 'LBP',
  Stable = 'Stable',
  Omni = 'Omni',
}

export enum PoolError {
  TradingLimitReached = 'TradingLimitReached',
  InsufficientTradingAmount = 'InsufficientTradingAmount',
  InsufficientBalance = 'InsufficientBalance',
  MaxInRatioExceeded = 'MaxInRatioExceeded',
  AssetAmountNotReachedLimit = 'AssetAmountNotReachedLimit',
  AssetAmountExceededLimit = 'AssetAmountExceededLimit',
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

export type PoolSell = {
  calculatedOut: BigNumber;
};

export type PoolBuy = {
  calculatedIn: BigNumber;
};

export type Transfer = {
  amountIn: BigNumber;
  amountOut: BigNumber;
  fee: BigNumber;
  errors: PoolError[];
};

export type SellTransfer = Transfer & PoolSell;
export type BuyTransfer = Transfer & PoolBuy;

export interface Pool extends PoolBase {
  validPair(tokenIn: string, tokenOut: string): boolean;
  parsePoolPair(tokenIn: string, tokenOut: string): PoolPair;
  validateBuy(poolPair: PoolPair, amountOut: BigNumber): BuyTransfer;
  validateSell(poolPair: PoolPair, amountOut: BigNumber): SellTransfer;
  calculateInGivenOut(poolPair: PoolPair, amountOut: BigNumber): BigNumber;
  calculateOutGivenIn(poolPair: PoolPair, amountIn: BigNumber): BigNumber;
  spotPriceInGivenOut(poolPair: PoolPair): BigNumber;
  spotPriceOutGivenIn(poolPair: PoolPair): BigNumber;
  calculateTradeFee(amount: BigNumber): BigNumber;
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
    spotPrice: BigNumber;
    tradeFeePct: BigNumber;
    priceImpactPct: BigNumber;
  };

export type SellSwap = Swap & PoolSell;
export type BuySwap = Swap & PoolBuy;

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

export type Amount = {
  amount: BigNumber;
  decimals: number;
};
