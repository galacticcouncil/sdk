import { Hop, PoolBase, PoolService, Transaction } from '../types';
import { XykPolkadotApiClient } from './xyk/xykPolkadotApiClient';
import { LbpPolkadotApiClient } from './lbp/lbpPolkadotApiClient';

import { ApiPromise } from '@polkadot/api';
import { BigNumber } from '../utils/bignumber';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';

export class PolkadotApiPoolService implements PoolService {
  private readonly api: ApiPromise;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  async getPools(): Promise<PoolBase[]> {
    const pools: PoolBase[][] = [];
    const xykPools = await new XykPolkadotApiClient(this.api).getPools();
    const lbpPools = await new LbpPolkadotApiClient(this.api).getPools();
    pools.push(xykPools);
    pools.push(lbpPools);
    return pools.flat();
  }

  buildBuyTx(
    assetIn: string,
    assetOut: string,
    amountOut: BigNumber,
    maxAmountIn: BigNumber,
    route: Hop[]
  ): Transaction {
    const tx = this.api.tx.router.buy(assetIn, assetOut, amountOut.toFixed(), maxAmountIn.toFixed(), route);
    const getTx = (): SubmittableExtrinsic => {
      return tx;
    };
    return { hex: tx.toHex(), name: 'RouterBuy', get: getTx } as Transaction;
  }

  buildSellTx(
    assetIn: string,
    assetOut: string,
    amountIn: BigNumber,
    minAmountOut: BigNumber,
    route: Hop[]
  ): Transaction {
    const tx = this.api.tx.router.sell(assetIn, assetOut, amountIn.toFixed(), minAmountOut.toFixed(), route);
    const getTx = (): SubmittableExtrinsic => {
      return tx;
    };
    return { hex: tx.toHex(), name: 'RouterSell', get: getTx } as Transaction;
  }
}
