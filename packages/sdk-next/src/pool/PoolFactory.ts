import { LbpPool, LbpPoolBase } from './lbp';
import { OmniPool, OmniPoolBase } from './omni';
import { StableSwap, StableSwapBase } from './stable';
import { XykPool } from './xyk';

import { Pool, PoolBase, PoolType } from './types';

export class PoolFactory {
  static get(pool: PoolBase): Pool {
    switch (pool.type) {
      case PoolType.XYK:
        return XykPool.fromPool(pool);
      case PoolType.Omni:
        return OmniPool.fromPool(pool as OmniPoolBase);
      case PoolType.LBP:
        return LbpPool.fromPool(pool as LbpPoolBase);
      case PoolType.Stable:
        return StableSwap.fromPool(pool as StableSwapBase);
      default: {
        throw new Error('Pool type ' + pool.type + ' is not supported yet');
      }
    }
  }
}
