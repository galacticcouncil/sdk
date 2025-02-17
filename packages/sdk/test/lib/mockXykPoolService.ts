import { XykPoolFees } from '../../src/pool/xyk/XykPool';
import {
  Hop,
  PoolBase,
  IPoolService,
  Transaction,
  PoolFees,
  PoolType,
  Pool,
  PoolFee,
  PoolPair,
} from '../../src/types';
import { BigNumber } from '../../src/utils/bignumber';
import { xykPools } from '../data/xykPools';

const fees: XykPoolFees = {
  exchangeFee: [3, 1000] as PoolFee,
};

export class MockXykPoolService implements IPoolService {
  getPools(_includeOnly?: PoolType[]): Promise<PoolBase[]> {
    return Promise.resolve(xykPools);
  }

  getPoolFees(poolPair: PoolPair, pool: Pool): Promise<PoolFees> {
    return Promise.resolve(fees);
  }

  buildBuyTx(
    _assetIn: string,
    _assetOut: string,
    _amountOut: BigNumber,
    _maxAmountIn: BigNumber,
    _route: Hop[]
  ): Transaction {
    throw new Error('Method not implemented.');
  }

  buildSellTx(
    _assetIn: string,
    _assetOut: string,
    _amountIn: BigNumber,
    _minAmountOut: BigNumber,
    _route: Hop[]
  ): Transaction {
    throw new Error('Method not implemented.');
  }
}
