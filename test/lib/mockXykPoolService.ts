import { Hop, PoolBase, IPoolService, Transaction, PoolFees, PoolType } from '../../src/types';
import { BigNumber } from '../../src/utils/bignumber';
import { xykPools } from '../data/xykPools';

export class MockXykPoolService implements IPoolService {
  getPools(_includeOnly?: PoolType[]): Promise<PoolBase[]> {
    return Promise.resolve(xykPools);
  }

  getDynamicFees(_asset: string, _poolType: PoolType): Promise<PoolFees | null> {
    return Promise.resolve(null);
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
