import { BigNumber } from "./utils/bignumber";

export enum PoolType {
  XYK = "XYK",
  LBP = "LBP",
  Stable = "Stable",
  Omni = "Omni",
}

export interface PoolPair {
  id: string;
  address: string;
  poolType: PoolType;
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
  parsePoolPair(tokenIn: string, tokenOut: string): PoolPair;
  calculateInGivenOut(poolPair: PoolPair, amountOut: BigNumber): BigNumber;
  calculateOutGivenIn(poolPair: PoolPair, amountIn: BigNumber): BigNumber;
  getSpotPrice(poolPair: PoolPair): BigNumber;
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
