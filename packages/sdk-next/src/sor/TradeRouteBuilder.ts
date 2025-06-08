import { Enum } from 'polkadot-api';

import { Hop, PoolType } from '../pool';

import { Swap, TradeRoute } from './types';

export class TradeRouteBuilder {
  static build(swaps: Swap[]): TradeRoute[] {
    return swaps.map(({ assetIn, assetOut, pool, poolId }: Hop) => {
      if (pool === PoolType.Stable) {
        return {
          pool: Enum('Stableswap', poolId!),
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
}
