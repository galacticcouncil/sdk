import type { AssetType } from '../types';

export type PoolFilter = {
  useOnly?: PoolType[];
  exclude?: PoolType[];
};

export enum PoolType {
  Aave = 'Aave',
  LBP = 'LBP',
  Omni = 'Omnipool',
  Stable = 'Stableswap',
  XYK = 'XYK',
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
  id?: number;
  type: PoolType;
  tokens: PoolToken[];
  maxInRatio: bigint;
  maxOutRatio: bigint;
  minTradingLimit: bigint;
};

export interface PoolToken {
  id: number;
  balance: bigint;
  decimals?: number;
  existentialDeposit: bigint;
  tradeable?: number;
  type: AssetType;
}

export type PoolTokenOverride = Pick<PoolToken, 'id' | 'decimals'>;

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

export interface IPoolCtxProvider {
  getPools(): Promise<PoolBase[]>;
  getPoolFees(poolPair: PoolPair, pool: Pool): Promise<PoolFees>;
}

export type Hop = {
  pool: PoolType;
  poolAddress: string;
  poolId?: number;
  assetIn: number;
  assetOut: number;
};
