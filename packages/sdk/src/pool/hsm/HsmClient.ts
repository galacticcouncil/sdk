import { UnsubscribePromise } from '@polkadot/api-base/types';

import { PoolType, PoolPair, PoolFees, PoolBase } from '../types';

import { PoolClient } from '../PoolClient';

export class HsmClient extends PoolClient {
  isSupported(): boolean {
    return this.api.query.hsm !== undefined;
  }

  getPoolType(): PoolType {
    return PoolType.HSM;
  }

  getPoolFees(poolPair: PoolPair, address: string): Promise<PoolFees> {
    throw new Error('Method not implemented.');
  }

  protected loadPools(): Promise<PoolBase[]> {
    throw new Error('Method not implemented.');
  }

  protected subscribePoolChange(pool: PoolBase): UnsubscribePromise {
    throw new Error('Method not implemented.');
  }
}
