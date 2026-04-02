import { OfflinePoolClient } from './OfflinePoolClient';
import { IOfflinePoolServiceDataSource } from '../types';
import { PoolFee, PoolFees, PoolPair, PoolType } from '../../types';
import { LbpPoolBase, LbpPoolFees } from '../../lbp';

export class LbpPoolOfflineClient extends OfflinePoolClient {
  constructor(dataSource: IOfflinePoolServiceDataSource) {
    super(dataSource, PoolType.LBP);
  }

  isSupported(): boolean {
    return this.pools.length > 0;
  }

  getPoolType(): PoolType {
    return PoolType.LBP;
  }

  async getPoolFees(
    _block: number,
    _poolPair: PoolPair,
    address: string
  ): Promise<PoolFees> {
    const pool = this.pools.find(
      (pool) => pool.address === address
    ) as LbpPoolBase;
    return {
      repayFee: this.constants.lbpRepayFee,
      exchangeFee: pool.fee as PoolFee,
    } as LbpPoolFees;
  }
}
