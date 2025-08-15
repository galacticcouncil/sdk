import type { Asset } from '../types';
import type { BigNumber } from '../utils/bignumber';

export type PoolFilter = {
  includeOnly?: PoolType[];
  exclude?: PoolType[];
};

export enum PoolType {
  Aave = 'Aave',
  LBP = 'Lbp',
  Omni = 'Omnipool',
  Stable = 'Stableswap',
  XYK = 'Xyk',
  HSM = 'Hsm',
}

export enum PoolError {
  UnknownError = 'UnknownError',
  InsufficientTradingAmount = 'InsufficientTradingAmount',
  MaxInRatioExceeded = 'MaxInRatioExceeded',
  MaxOutRatioExceeded = 'MaxOutRatioExceeded',
  TradeNotAllowed = 'TradeNotAllowed',
  MaxBuyBackExceeded = 'MaxBuyBackExceeded',
  MaxBuyPriceExceeded = 'MaxBuyPriceExceeded',
}

export interface PoolPair {
  assetIn: string;
  assetOut: string;
  decimalsIn: number;
  decimalsOut: number;
  balanceIn: BigNumber;
  balanceOut: BigNumber;
  assetInED: BigNumber;
  assetOutED: BigNumber;
}

export type PoolBase = {
  address: string;
  id?: string;
  type: PoolType;
  tokens: PoolToken[];
  maxInRatio: number;
  maxOutRatio: number;
  minTradingLimit: number;
};

export interface PoolToken extends Asset {
  id: string;
  balance: string;
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
  calculatedOut: BigNumber;
};

export type PoolBuy = {
  calculatedIn: BigNumber;
};

export type PoolSwap = {
  amountIn: BigNumber;
  amountOut: BigNumber;
  feePct: number;
  errors: PoolError[];
};

export type SellCtx = PoolSwap & PoolSell;
export type BuyCtx = PoolSwap & PoolBuy;

export interface Pool extends PoolBase {
  validatePair(tokenIn: string, tokenOut: string): boolean;
  parsePair(tokenIn: string, tokenOut: string): PoolPair;
  validateAndBuy(
    poolPair: PoolPair,
    amountOut: BigNumber,
    fees: PoolFees | null
  ): BuyCtx;
  validateAndSell(
    poolPair: PoolPair,
    amountIn: BigNumber,
    fees: PoolFees | null
  ): SellCtx;
  calculateInGivenOut(poolPair: PoolPair, amountOut: BigNumber): BigNumber;
  calculateOutGivenIn(poolPair: PoolPair, amountIn: BigNumber): BigNumber;
  spotPriceInGivenOut(poolPair: PoolPair): BigNumber;
  spotPriceOutGivenIn(poolPair: PoolPair): BigNumber;
}

export interface IPoolService {
  getPools(filter?: PoolFilter): Promise<PoolBase[]>;
  getPoolFees(poolPair: PoolPair, pool: Pool): Promise<PoolFees>;
}

export type Hop = {
  pool: PoolType;
  poolAddress: string;
  poolId?: string;
  assetIn: string;
  assetOut: string;
};
