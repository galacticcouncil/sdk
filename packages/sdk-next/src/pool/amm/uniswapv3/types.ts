import { PoolBase, PoolFee, PoolFees } from '../../types';

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
  /**
   * The token contracts this pool is built on, in pool order.
   *
   * Not derivable: an `Erc20` asset does not live at its `0x…01 ++ id` alias.
   */
  addr0: `0x${string}`;
  addr1: `0x${string}`;
}

export type UniswapV3PoolFees = PoolFees & {
  fee: PoolFee;
};
