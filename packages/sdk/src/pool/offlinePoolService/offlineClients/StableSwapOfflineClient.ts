import { OfflinePoolClient } from './OfflinePoolClient';
import { IOfflinePoolServiceDataSource } from '../types';
import { PoolFee, PoolFees, PoolPair, PoolType } from '../../types';
import { StableSwapBase, StableSwapFees } from '../../stable/StableSwap';

export class StableSwapOfflineClient extends OfflinePoolClient {
  constructor(dataSource: IOfflinePoolServiceDataSource) {
    super(dataSource, PoolType.Stable);
  }

  isSupported(): boolean {
    return this.pools.length > 0;
  }
  getPoolType(): PoolType {
    return PoolType.Stable;
  }
  async getPoolFees(
    _block: number,
    _poolPair: PoolPair,
    address: string
  ): Promise<PoolFees> {
    const pool = this.pools.find(
      (pool) => pool.address === address
    ) as StableSwapBase;
    return {
      fee: pool.pegsFee as PoolFee,
    } as StableSwapFees;
  }
}
