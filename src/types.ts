import { BigNumber } from "./utils/bignumber";

export interface Asset {
  key: string;
  name: string;
}

export enum PoolType {
  XYK = "XYK",
  LBP = "LBP",
  Stable = "Stable",
  Omni = "Omni",
}

export interface PoolAsset {
  id: string;
  assetIn: string;
  assetOut: string;
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

export interface Pool {
  type: PoolType;
  getPoolPairs(): Promise<PoolPair[]>;
  getSellPrice(poolPair: PoolPair, amountIn: BigNumber): BigNumber;
  getBuyPrice(poolPair: PoolPair, amountOut: BigNumber): BigNumber;
  getSpotPrice(poolPair: PoolPair): BigNumber;
}

export interface PoolService {
  getPools(): Pool[];
}
