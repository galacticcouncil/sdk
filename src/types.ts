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
  decimalsIn: number;
  decimalsOut: number;
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
  feePercentage: string;
};

export type Swap = Humanizer &
  Hop & {
    tokenInDecimals: number;
    tokenOutDecimals: number;
    swapAmount: BigNumber;
    returnAmount: BigNumber;
    returnFinalAmount: BigNumber;
    swapFee: BigNumber;
    spotPrice: BigNumber;
    priceImpact: BigNumber;
  };

export type Trade = Humanizer & {
  tradeAmount: BigNumber;
  returnAmount: BigNumber;
  spotPrice: BigNumber;
  priceImpact: BigNumber;
  swaps: Swap[];
};

export interface Humanizer {
  toHuman(): any;
}
