import { PolkadotClient } from 'polkadot-api';

import { memoize1 } from '@thi.ng/memoize';

import {
  type Observable,
  combineLatest,
  firstValueFrom,
  from,
  map,
  switchMap,
} from 'rxjs';

import { BalanceClient } from '../client';
import { Asset, AssetAmount } from '../types';

import { PoolBase, PoolFees, PoolType } from './types';

export abstract class PoolClient<T extends PoolBase> extends BalanceClient {
  protected pools: T[] = [];

  private assets: Map<number, Asset> = new Map([]);
  private mem: number = 0;

  private memPools = memoize1((mem: number) => {
    console.log(this.getPoolType(), 'mem pools', mem, '✅');
    return this.loadPools();
  });

  constructor(client: PolkadotClient) {
    super(client);
  }

  abstract getPoolType(): PoolType;

  abstract getPoolFees(address: string, feeAsset: number): Promise<PoolFees>;

  abstract isSupported(): Promise<boolean>;

  abstract loadPools(): Promise<T[]>;

  abstract subscribePoolChange(pool: T): Observable<T>;

  async getPoolsMem(): Promise<T[]> {
    return this.memPools(this.mem);
  }

  async getPools(): Promise<T[]> {
    return firstValueFrom(this.getSubscriber());
  }

  getSubscriber(): Observable<T[]> {
    return from(this.getPoolsMem()).pipe(
      switchMap((pools) =>
        combineLatest(
          pools.map((pool) =>
            combineLatest([
              this.subscribePoolChange(pool),
              this.subscribeBalance(pool.address),
            ]).pipe(map(([pool, balances]) => this.updatePools(pool, balances)))
          )
        )
      )
    );
  }

  private updatePools = (pool: T, balances: AssetAmount[]): T => {
    const tokens = pool.tokens.map((token) => {
      const balance = balances.find((balance) => balance.id === token.id);
      if (balance) {
        return {
          ...token,
          balance: balance.amount,
        };
      }
      return token;
    });

    return {
      ...pool,
      tokens: tokens,
    };
  };
}
