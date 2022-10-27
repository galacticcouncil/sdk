import { Hop, PoolBase, PoolService, PoolType, Transaction } from '../types';
import { XykPolkadotApiClient } from './xyk/xykPolkadotApiClient';
import { LbpPolkadotApiClient } from './lbp/lbpPolkadotApiClient';

import { BigNumber } from '../utils/bignumber';
import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';

export class PolkadotApiPoolService implements PoolService {
  protected readonly api: ApiPromise;
  protected readonly xykClient: XykPolkadotApiClient;
  protected readonly lbpClient: LbpPolkadotApiClient;

  constructor(api: ApiPromise) {
    this.api = api;
    this.xykClient = new XykPolkadotApiClient(this.api);
    this.lbpClient = new LbpPolkadotApiClient(this.api);
  }

  async getPools(includeOnly: PoolType[]): Promise<PoolBase[]> {
    if (includeOnly.length == 0) {
      const pools = await Promise.all([this.xykClient.getPools(), this.lbpClient.getPools()]);
      return pools.flat();
    }

    const poolList: Promise<PoolBase[]>[] = [];
    includeOnly.forEach((poolType: PoolType) => {
      switch (poolType) {
        case PoolType.XYK:
          poolList.push(this.xykClient.getPools());
          break;
        case PoolType.LBP:
          poolList.push(this.lbpClient.getPools());
          break;
      }
    });

    const pools = await Promise.all(poolList);
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
