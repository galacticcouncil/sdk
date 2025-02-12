import { PoolService } from './PoolService';

import { Pool, PoolFees, PoolPair } from '../types';

import { ApiPromise } from '@polkadot/api';
import { LRUCache } from '@thi.ng/cache';

export class CachingPoolService extends PoolService {
  private feeCache: LRUCache<string, PoolFees>;
  private disconnectSubscribeNewHeads: (() => void) | null = null;

  constructor(api: ApiPromise) {
    super(api);
    this.feeCache = new LRUCache<string, PoolFees>(null);
    this.api.rpc.chain
      .subscribeNewHeads(async (_lastHeader) => {
        this.feeCache.release();
      })
      .then((subsFn) => {
        this.disconnectSubscribeNewHeads = subsFn;
      });
  }

  async getPoolFees(poolPair: PoolPair, pool: Pool): Promise<PoolFees> {
    const key = [pool.address, poolPair.assetIn, poolPair.assetOut].join('-');
    const hasKey = this.feeCache.has(key);
    if (hasKey) {
      return this.feeCache.get(key)!;
    } else {
      const fees = await super.getPoolFees(poolPair, pool);
      this.feeCache.set(key, fees);
      return fees;
    }
  }

  async destroy(): Promise<void> {
    console.log(`Destroying pool cache! \nItems: [${this.feeCache.length}]`);
    this.feeCache.release();
    this.disconnectSubscribeNewHeads?.();
  }
}
