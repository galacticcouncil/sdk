import { ApiPromise } from '@polkadot/api';

import { EvmClient } from '../evm';

import { Pool, PoolFees, PoolPair } from './types';

import { PoolService } from './PoolService';

/**
 * Block scope pool fee memo for short-term deduplication
 * of consecutive identical get fee calls
 */
export class CachingPoolService extends PoolService {
  private feeCache = new Map<string, Promise<PoolFees>>();

  constructor(api: ApiPromise, evm: EvmClient) {
    super(api, evm);
  }

  protected override onNewBlock(block: number): void {
    super.onNewBlock(block);
    this.feeCache.clear();
  }

  async getPoolFees(poolPair: PoolPair, pool: Pool): Promise<PoolFees> {
    const key = [pool.address, poolPair.assetIn, poolPair.assetOut].join('-');

    if (this.feeCache.has(key)) {
      return this.feeCache.get(key)!;
    }

    const promise = super.getPoolFees(poolPair, pool);
    this.feeCache.set(key, promise);
    return promise;
  }

  async destroy() {
    this.feeCache.clear();
    super.destroy();
  }
}
