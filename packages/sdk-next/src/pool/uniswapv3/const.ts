export const UNISWAP_V3_FACTORY = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';

export type V3PoolConfig = {
  assetA: number;
  assetB: number;
  fee: number;
};

export const V3_POOLS: V3PoolConfig[] = [
  { assetA: 16, assetB: 9, fee: 3000 },
  { assetA: 16, assetB: 9, fee: 500 },
];
