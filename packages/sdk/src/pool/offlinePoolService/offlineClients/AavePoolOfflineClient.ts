import { OfflinePoolClient } from './OfflinePoolClient';
import { IOfflinePoolServiceDataSource } from '../types';
import { PoolFees, PoolPair, PoolType } from '../../types';

export class AavePoolOfflineClient extends OfflinePoolClient {
  constructor(dataSource: IOfflinePoolServiceDataSource) {
    super(dataSource, PoolType.Aave);
  }

  isSupported(): boolean {
    return this.pools.length > 0;
  }
  async getPoolFees(
    _block: number,
    _poolPair: PoolPair,
    _address: string
  ): Promise<PoolFees> {
    return {} as PoolFees;
  }

  getPoolType(): PoolType {
    return PoolType.Aave;
  }
}
