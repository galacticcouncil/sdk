import { Swap, TradeRoute } from './types';

import { PoolType } from '../pool';

export class TradeRouteBuilder {
  static build(swaps: Swap[]): TradeRoute[] {
    return swaps.map(({ assetIn, assetOut, pool, poolId }) => {
      if (pool === PoolType.Stable) {
        return {
          pool: { Stableswap: poolId } as { Stableswap: string },
          assetIn,
          assetOut,
        };
      }
      return { pool, assetIn, assetOut };
    });
  }
}
