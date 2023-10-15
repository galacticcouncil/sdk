import { Hop, PoolType } from '../types';

export function buildRoute(route: Hop[]) {
  return route.map(({ assetIn, assetOut, pool, poolId }: Hop) => {
    if (pool === PoolType.Stable) {
      return {
        pool: {
          Stableswap: poolId,
        },
        assetIn,
        assetOut,
      };
    }
    return {
      pool,
      assetIn,
      assetOut,
    };
  });
}
