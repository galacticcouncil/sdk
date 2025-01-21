import type { Asset, Transaction } from '../types';

export enum PoolType {
  XYK = 'Xyk',
  LBP = 'Lbp',
  Stable = 'Stableswap',
  Omni = 'Omnipool',
}

export enum PoolError {
  InsufficientTradingAmount = 'InsufficientTradingAmount',
  MaxInRatioExceeded = 'MaxInRatioExceeded',
  MaxOutRatioExceeded = 'MaxOutRatioExceeded',
  TradeNotAllowed = 'TradeNotAllowed',
  UnknownError = 'UnknownError',
}

export interface PoolPair {
  assetIn: number;
  assetOut: number;
  decimalsIn: number;
  decimalsOut: number;
  balanceIn: bigint;
  balanceOut: bigint;
  assetInEd: bigint;
  assetOutEd: bigint;
}

export type PoolBase = {
  address: string;
  id?: string;
  type: PoolType;
  tokens: PoolToken[];
  maxInRatio: bigint;
  maxOutRatio: bigint;
  minTradingLimit: bigint;
};

export interface PoolToken extends Asset {
  id: number;
  balance: bigint;
  tradeable?: number;
}

export type PoolLimits = Pick<
  PoolBase,
  'maxInRatio' | 'maxOutRatio' | 'minTradingLimit'
>;

export type PoolFee = [numerator: number, denominator: number];

// Pool fee marker interface
export type PoolFees = {
  min?: PoolFee;
  max?: PoolFee;
};

export type PoolSell = {
  calculatedOut: bigint;
};

export type PoolBuy = {
  calculatedIn: bigint;
};

export type PoolSwap = {
  amountIn: bigint;
  amountOut: bigint;
  feePct: number;
  errors: PoolError[];
};

export type SellCtx = PoolSwap & PoolSell;
export type BuyCtx = PoolSwap & PoolBuy;

export interface Pool extends PoolBase {
  validatePair(tokenIn: number, tokenOut: number): boolean;
  parsePair(tokenIn: number, tokenOut: number): PoolPair;
  validateAndBuy(
    poolPair: PoolPair,
    amountOut: bigint,
    dynamicFees: PoolFees | null
  ): BuyCtx;
  validateAndSell(
    poolPair: PoolPair,
    amountOut: bigint,
    dynamicFees: PoolFees | null
  ): SellCtx;
  calculateInGivenOut(poolPair: PoolPair, amountOut: bigint): bigint;
  calculateOutGivenIn(poolPair: PoolPair, amountIn: bigint): bigint;
  spotPriceInGivenOut(poolPair: PoolPair): bigint;
  spotPriceOutGivenIn(poolPair: PoolPair): bigint;
}

export interface IPoolService {
  getPools(includeOnly?: PoolType[]): Promise<PoolBase[]>;
  getPoolFees(pool: Pool, feeAsset?: number): Promise<PoolFees>;
  buildBuyTx(
    assetIn: number,
    assetOut: number,
    amountOut: bigint,
    maxAmountIn: bigint,
    route: Hop[]
  ): Transaction;
  buildSellTx(
    assetIn: number,
    assetOut: number,
    amountIn: bigint,
    minAmountOut: bigint,
    route: Hop[]
  ): Transaction;
}

export type Hop = {
  pool: PoolType;
  poolAddress: string;
  poolId?: string;
  assetIn: number;
  assetOut: number;
};
