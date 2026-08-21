export type V3PoolConfig = {
  assetA: number;
  assetB: number;
  fee: number;
};

/**
 * Pools this venue routes through.
 *
 * - Curated, not discovered: creating a v3 pool is permissionless, so an entry
 *   here is a decision that both the pair and the fee tier deserve flow
 * - A pool at an unlisted tier is ignored, however deep it is
 * - `factory.getPool` is deterministic, so an entry resolves to exactly one pool
 * - aDOT-HOLLAR runs at 0.3% only; at 5bp its arbitrage-dominated flow costs
 *   more in toxicity than the tier collects
 */
export const V3_POOLS: V3PoolConfig[] = [
  { assetA: 1001, assetB: 222, fee: 3000 },
];
