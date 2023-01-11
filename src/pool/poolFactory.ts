import { Pool, PoolBase, PoolType } from '../types';
import { LbpPool, LbpPoolBase } from './lbp/lbpPool';
import { OmniPool, OmniPoolBase } from './omni/omniPool';
import { XykPool } from './xyk/xykPool';

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
