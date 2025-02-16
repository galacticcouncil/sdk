import { Enum } from 'polkadot-api';

import { Hop, PoolType } from './types';

export function buildRoute(route: Hop[]) {
  return route.map(({ assetIn, assetOut, pool, poolId }: Hop) => {
    if (pool === PoolType.Stable) {
      return {
        pool: Enum('Stableswap', poolId),
        asset_in: assetIn,
        asset_out: assetOut,
      };
    }
    return {
      pool: Enum(pool),
      asset_in: assetIn,
      asset_out: assetOut,
    };
  });
}
