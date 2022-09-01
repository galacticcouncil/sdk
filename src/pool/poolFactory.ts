import { Pool, PoolBase, PoolType } from '../types';
import { XykPool } from './xyk/xykPool';

export class PoolFactory {
  static get(pool: PoolBase): Pool {
    switch (pool.type) {
      case PoolType.XYK:
        return XykPool.fromPool(pool);
      default: {
        throw new Error('Pool type ' + pool.type + ' is not supported yet');
      }
    }
  }
}
