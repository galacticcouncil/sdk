import { OfflinePoolClient } from './OfflinePoolClient';
import { IOfflinePoolServiceDataSource } from '../types';
import { PoolFees, PoolPair, PoolType } from '../../types';
import { XykPoolFees } from '../../xyk/XykPool';

export class XykPoolOfflineClient extends OfflinePoolClient {
  constructor(dataSource: IOfflinePoolServiceDataSource) {
    super(dataSource, PoolType.XYK);
  }

  isSupported(): boolean {
    return this.pools.length > 0;
  }

  getPoolType(): PoolType {
    return PoolType.XYK;
  }

  async getPoolFees(
    _block: number,
    _poolPair: PoolPair,
    _address: string
  ): Promise<PoolFees> {
    return {
      exchangeFee: this.constants.xykGetExchangeFee,
    } as XykPoolFees;
  }
}
