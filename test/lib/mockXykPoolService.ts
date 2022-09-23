import BigNumber from 'bignumber.js';
import { AssetPair, PoolBase, PoolService, Trade } from '../../src/types';
import { xykPools } from '../data/xykPools';

export class MockXykPoolService implements PoolService {
  getPools(): Promise<PoolBase[]> {
    return Promise.resolve(xykPools);
  }

  buy(assetIn: string, assetOut: string, amountOut: BigNumber, maxAmountIn: BigNumber, route: AssetPair[]): void {
    throw new Error('Method not implemented.');
  }

  sell(assetIn: string, assetOut: string, amountIn: BigNumber, minAmountOut: BigNumber, route: AssetPair[]): void {
    throw new Error('Method not implemented.');
  }
}
