import { Pool, PoolBase, PoolType } from '../types';
import { LbpPool } from './lbp/lbpPool';
import { OmniPool } from './omni/omniPool';
import { XykPool } from './xyk/xykPool';

export class PoolFactory {
  static get(pool: PoolBase): Pool {
    switch (pool.type) {
      case PoolType.XYK:
        return XykPool.fromPool(pool);
      case PoolType.Omni:
        return OmniPool.fromPool(pool);
      case PoolType.LBP:
        return LbpPool.fromPool(pool);
      default: {
        throw new Error('Pool type ' + pool.type + ' is not supported yet');
      }
    }
  }
}
