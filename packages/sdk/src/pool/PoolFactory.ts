import { LbpPool, LbpPoolBase } from './lbp';
import { OmniPool, OmniPoolBase } from './omni';
import { StableSwap, StableSwapBase } from './stable';
import { HsmPool, HsmPoolBase } from './hsm';
import { XykPool } from './xyk';
import { AavePool } from './aave';

import { Pool, PoolBase, PoolType } from './types';

export class PoolFactory {
  static get(pool: PoolBase): Pool {
    switch (pool.type) {
      case PoolType.Aave:
        return AavePool.fromPool(pool);
      case PoolType.XYK:
        return XykPool.fromPool(pool);
      case PoolType.Omni:
        return OmniPool.fromPool(pool as OmniPoolBase);
      case PoolType.LBP:
        return LbpPool.fromPool(pool as LbpPoolBase);
      case PoolType.Stable:
        return StableSwap.fromPool(pool as StableSwapBase);
      case PoolType.HSM:
        return HsmPool.fromPool(pool as HsmPoolBase);
      default: {
        throw new Error('Pool type ' + pool.type + ' is not supported yet');
      }
    }
  }
}
