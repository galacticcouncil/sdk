import { PoolBase, PoolService } from '../types';
import { XykPolkadotClient } from './xyk/xykPolkadotClient';

import { ApiPromise } from '@polkadot/api';

export class PolkadotPoolService implements PoolService {
  private readonly api: ApiPromise;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  async getPools(): Promise<PoolBase[]> {
    const pools: PoolBase[][] = [];
    const xykPools = await new XykPolkadotClient(this.api).getPools();
    pools.push(xykPools);
    return pools.flat();
  }
}
