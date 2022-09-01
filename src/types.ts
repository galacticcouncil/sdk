import { BigNumber } from './utils/bignumber';

export type PoolAsset = { token: string; symbol: string };

export enum PoolType {
  XYK = 'XYK',
  LBP = 'LBP',
  Stable = 'Stable',
  Omni = 'Omni',
}

export interface PoolPair {
  swapFee: BigNumber;
  tokenIn: string;
  tokenOut: string;
  balanceIn: BigNumber;
  balanceOut: BigNumber;
}

export type PoolBase = {
  address: string;
  type: PoolType;
  swapFee: string;
  tokens: PoolToken[];
};

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
  fee: string;
};

export type Swap = {
  tokenIn: string;
  tokenOut: string;
  amount: BigNumber;
  calculated: BigNumber;
  final: BigNumber;
  fee: BigNumber;
  spotPrice: BigNumber;
};
