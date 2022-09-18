import { PoolBase, PoolService } from '../types';
import { XykPolkadotClient } from './xyk/xykPolkadotClient';
import { LbpPolkadotClient } from './lbp/lbpPolkadotClient';

import { ApiPromise } from '@polkadot/api';

export class PolkadotPoolService implements PoolService {
  private readonly api: ApiPromise;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  async getPools(): Promise<PoolBase[]> {
    const pools: PoolBase[][] = [];
    const xykPools = await new XykPolkadotClient(this.api).getPools();
    const lbpPools = await new LbpPolkadotClient(this.api).getPools();
    pools.push(xykPools);
    pools.push(lbpPools);
    return pools.flat();
  }
}
