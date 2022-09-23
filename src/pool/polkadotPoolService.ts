import { Hop, PoolBase, PoolService } from '../types';
import { XykPolkadotClient } from './xyk/xykPolkadotClient';
import { LbpPolkadotClient } from './lbp/lbpPolkadotClient';

import { ApiPromise } from '@polkadot/api';
import { BigNumber } from '../utils/bignumber';

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

  sell(assetIn: string, assetOut: string, amountIn: BigNumber, minAmountOut: BigNumber, route: Hop[]) {
    console.log('Sell executed!');
    console.log(route);
    const tx = this.api.tx.router.sell(assetIn, assetOut, amountIn.toFixed(), minAmountOut.toFixed(), route);
    console.log(tx);
    console.log(tx.toHex());
  }

  buy(assetIn: string, assetOut: string, amountOut: BigNumber, maxAmountIn: BigNumber, route: Hop[]) {
    console.log('Buy executed!');
    const tx = this.api.tx.router.buy(assetIn, assetOut, amountOut.toFixed(), maxAmountIn.toFixed(), route);
    console.log(tx);
    console.log(tx.toHex());
  }
}
