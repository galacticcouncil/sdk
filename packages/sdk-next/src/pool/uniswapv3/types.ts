import { PoolBase, PoolFee, PoolFees } from '../types';

export type V3Tick = {
  index: number;
  liquidityNet: bigint;
  liquidityGross: bigint;
};

export type V3PoolState = {
  fee: number;
  sqrtPriceX96: bigint;
  tick: number;
  liquidity: bigint;
  tickSpacing: number;
  ticks: V3Tick[];
};

export interface UniswapV3PoolBase extends PoolBase, V3PoolState {
  token0: number;
  token1: number;
}

export type UniswapV3PoolFees = PoolFees & {
  fee: PoolFee;
};
