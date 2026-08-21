export type V3PoolConfig = {
  assetA: number;
  assetB: number;
  fee: number;
};

/**
 * Pools this venue will route through.
 *
 * Curated rather than discovered: creating a v3 pool is permissionless, so the
 * router must not pick up whatever exists. An entry here is a decision that the
 * pair AND the fee tier are ones we want flow going through — a pool created at
 * an unlisted tier is ignored even if it has depth.
 *
 * Resolution is by `factory.getPool(token0, token1, fee)`, which is deterministic,
 * so an entry can only ever resolve to the one canonical pool for that triple.
 *
 * aDOT-HOLLAR is 0.3% only. The 0.05% tier was rejected for this pair: flow will be
 * arbitrage-dominated, and at 5bp the per-unit toxicity exceeds the toll.
 */
export const V3_POOLS: V3PoolConfig[] = [{ assetA: 1001, assetB: 222, fee: 3000 }];
