import { LbpPool, LbpPoolBase } from './lbp/LbpPool';
import { OmniPool, OmniPoolBase } from './omni/OmniPool';
import { XykPool } from './xyk/XykPool';

import { Pool, PoolBase, PoolType } from '../types';

export class PoolFactory {
  static get(pool: PoolBase): Pool {
    switch (pool.type) {
      case PoolType.XYK:
        return XykPool.fromPool(pool);
      case PoolType.Omni:
        return OmniPool.fromPool(pool as OmniPoolBase);
      case PoolType.LBP:
        return LbpPool.fromPool(pool as LbpPoolBase);
      default: {
        throw new Error('Pool type ' + pool.type + ' is not supported yet');
      }
    }
  }
}
