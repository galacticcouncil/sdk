import { Hop, PoolBase, IPoolService, Transaction } from '../../src/types';
import { BigNumber } from '../../src/utils/bignumber';
import { xykPools } from '../data/xykPools';

export class MockXykPoolService implements IPoolService {
  getPools(): Promise<PoolBase[]> {
    return Promise.resolve(xykPools);
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
