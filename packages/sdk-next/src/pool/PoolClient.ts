import { PolkadotClient } from 'polkadot-api';

import { memoize1 } from '@thi.ng/memoize';

import {
  type Observable,
  combineLatest,
  combineLatestAll,
  debounceTime,
  firstValueFrom,
  from,
  map,
  mergeAll,
  of,
  switchMap,
} from 'rxjs';

import { BalanceClient } from '../client';
import { SYSTEM_ASSET_ID } from '../consts';
import { AssetBalance } from '../types';

import { PoolBase, PoolFees, PoolTokenOverride, PoolType } from './types';

export abstract class PoolClient<T extends PoolBase> extends BalanceClient {
  private override: PoolTokenOverride[] = [];
  private mem: number = 0;

  private memPools = memoize1((mem: number) => {
    this.log(this.getPoolType(), 'mem pools', mem, '✅');
    return this.loadPools();
  });

  constructor(client: PolkadotClient) {
    super(client);
  }

  protected abstract loadPools(): Promise<T[]>;

  abstract getPoolFees(pool: T, feeAsset: number): Promise<PoolFees>;

  abstract getPoolType(): PoolType;

  abstract isSupported(): Promise<boolean>;

  abstract subscribePoolChange(pool: T): Observable<T>;

  async withOverride(override?: PoolTokenOverride[]) {
    this.override = override || [];
  }

  async getPoolsMem(): Promise<T[]> {
    return this.memPools(this.mem);
  }

  async getPools(): Promise<T[]> {
    const observers = from(this.getPoolsMem()).pipe(
      switchMap((pools) => this.subscribe(pools)),
      combineLatestAll()
    );
    return firstValueFrom(observers);
  }

  getSubscriber(): Observable<T> {
    return from(this.getPoolsMem()).pipe(
      switchMap((pools) => this.subscribe(pools)),
      mergeAll()
    );
  }

  private subscribe(pools: T[]): Observable<T>[] {
    return pools
      .filter((pool) => this.hasValidAssets(pool))
      .map((pool) =>
        combineLatest([
          this.subscribePoolChange(pool),
          this.subscribePoolBalance(pool),
        ]).pipe(
          debounceTime(250),
          map(([pool, balances]) => this.updatePool(pool, balances))
        )
      );
  }

  private subscribePoolBalance(pool: T): Observable<AssetBalance[]> {
    if (pool.type === PoolType.Aave) {
      return of([]);
    }

    const subs: Observable<AssetBalance | AssetBalance[]>[] = [
      this.subscribeTokensBalance(pool.address),
    ];

    if (this.hasSystemAsset(pool)) {
      const sub = this.subscribeSystemBalance(pool.address);
      subs.push(sub);
    }

    if (this.hasErc20Asset(pool)) {
      const ids = pool.tokens
        .filter((t) => t.type === 'Erc20')
        .map((t) => t.id);
      const sub = this.subscribeErc20Balance(pool.address, ids);
      subs.push(sub);
    }

    return combineLatest(subs).pipe(
      map((res) =>
        res
          .map((r) => {
            return Array.isArray(r) ? r : [r];
          })
          .flat()
      )
    );
  }

  private hasSystemAsset(pool: T): boolean {
    return pool.tokens.some((t) => t.id === SYSTEM_ASSET_ID);
  }

  private hasErc20Asset(pool: PoolBase) {
    return pool.tokens.some((t) => t.type === 'Erc20');
  }

  private hasValidAssets(pool: T): boolean {
    return pool.tokens.every(({ id, decimals, balance }) => {
      const override = this.override.find((o) => o.id === id);
      const hasDecimals = !!decimals || !!override?.decimals;
      return balance > 0n && hasDecimals;
    });
  }

  private updatePool = (pool: PoolBase, balances: AssetBalance[]): T => {
    const tokens = pool.tokens.map((token) => {
      const balance = balances.find((balance) => balance.id === token.id);
      const override = this.override.find((o) => o.id === token.id);
      if (balance) {
        return {
          ...token,
          balance: balance.balance.transferable,
          decimals: token.decimals || override?.decimals,
        };
      }
      return {
        ...token,
        decimals: token.decimals || override?.decimals,
      };
    });

    return {
      ...pool,
      tokens: tokens,
    } as T;
  };
}
