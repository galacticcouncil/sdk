export type V3PoolConfig = {
  assetA: number;
  assetB: number;
  fee: number;
};

/**
 * Pools this venue routes through.
 *
 * - Curated, not discovered: creating a v3 pool is permissionless
 * - A pool at an unlisted fee tier is ignored
 */
export const V3_POOLS: V3PoolConfig[] = [
  { assetA: 1001, assetB: 222, fee: 3000 },
];
