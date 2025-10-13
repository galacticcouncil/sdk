import { PolkadotClient } from 'polkadot-api';

import { memoize1 } from '@thi.ng/memoize';
import { TLRUCache } from '@thi.ng/cache';

import {
  Observable,
  ReplaySubject,
  Subscription,
  bufferCount,
  combineLatest,
  debounceTime,
  defer,
  filter,
  finalize,
  from,
  map,
  merge,
  of,
  pairwise,
  skip,
  share,
  startWith,
  switchMap,
  tap,
  throttleTime,
} from 'rxjs';

import { BalanceClient } from '../client';
import { SYSTEM_ASSET_ID } from '../consts';
import { EvmClient } from '../evm';
import { AssetBalance } from '../types';

import { PoolBase, PoolFees, PoolPair, PoolType } from './types';
import { PoolStore } from './PoolStore';

export abstract class PoolClient<T extends PoolBase> extends BalanceClient {
  protected evm: EvmClient;
  protected store = new PoolStore<T>();

  private shared$?: Observable<T[]>;

  private mem: number = 0;
  private memPoolsCache = new TLRUCache<number, Promise<T[]>>(null, {
    ttl: 6 * 1000,
  });

  private memPools = memoize1((mem: number) => {
    this.log(this.getPoolType(), 'sync mem pools', mem);
    return this.loadPools();
  }, this.memPoolsCache);

  constructor(client: PolkadotClient, evm: EvmClient) {
    super(client);
    this.evm = evm;
  }

  abstract isSupported(): Promise<boolean>;
  abstract getPoolFees(pair: PoolPair, address: string): Promise<PoolFees>;
  abstract getPoolType(): PoolType;
  protected abstract loadPools(): Promise<T[]>;
  protected abstract subscribeUpdates(): Subscription;

  private async getMemPools(): Promise<T[]> {
    return this.memPools(this.mem);
  }

  async getPools(): Promise<T[]> {
    const pools = await this.getMemPools();
    return pools.filter((p) => this.hasValidAssets(p));
  }

  getSubscriber(): Observable<T[]> {
    if (!this.shared$) {
      this.shared$ = this.subscribeStore();
    }

    return this.shared$.pipe(
      startWith([] as T[]),
      bufferCount(2, 1),
      map(([prev, curr]) => {
        if (prev.length === 0) return curr;
        return this.store.applyChangeset(curr);
      }),
      filter((arr) => arr.length > 0),
      /**
       * Rate-limit consumer emissions to ~1s, but first immediately
       */
      throttleTime(1000, undefined, { leading: true, trailing: true })
    );
  }

  private subscribeStore(): Observable<T[]> {
    return defer(() => {
      const sub = new Subscription();

      /**
       * Seed with a fresh load (valid pools only)
       */
      const seed$ = from(this.getMemPools()).pipe(
        map((pools) => pools.filter((p) => this.hasValidAssets(p))),
        tap((valid) => this.store.set(valid))
      );

      return seed$.pipe(
        /**
         * After store initialized, attach live writers (fire and forget)
         */
        tap(() => {
          //sub.add(this.subscribeBalances());
          sub.add(this.subscribeUpdates());
        }),

        /**
         * Emit the fresh seed immediately, then continue with the store
         * stream, but drop the subject replay (possible stale state)
         *
         * This ensures:
         *  - first subscription gets the fresh seed
         *  - re-subscriptions also get a fresh seed (ref-count 0)
         */
        switchMap((valid) =>
          merge(of(valid), this.store.asObservable().pipe(skip(1)))
        ),
        finalize(() => {
          /**
           * Kill internal wiring if no subscription active
           */
          sub.unsubscribe();
        })
      );
    }).pipe(
      /**
       * Ensures single internal wiring for all subscribers
       */
      share({
        /**
         * Late subscribers get the latest snapshot immediately from the
         * connector’s buffer, even if upstream hasn’t emitted again yet
         * in this ref-count cycle
         */
        connector: () => new ReplaySubject<T[]>(1),
        resetOnRefCountZero: true,
      })
    );
  }

  protected subscribeBalances(): Subscription {
    const pool$ = this.store.pools.map((pool) => {
      const { address } = pool;

      const subs: Observable<AssetBalance | AssetBalance[]>[] = [
        this.subscribeTokensBalance(address),
      ];

      if (this.hasSystemAsset(pool)) {
        const sysSub = this.subscribeSystemBalance(address);
        subs.push(sysSub);
      }

      if (this.hasErc20Asset(pool)) {
        const ids = pool.tokens
          .filter((t) => t.type === 'Erc20')
          .map((t) => t.id);
        const erc20Sub = this.subscribeErc20Balance(address, ids);
        subs.push(erc20Sub);
      }

      return combineLatest(subs).pipe(
        map((balance) => balance.flat()),
        pairwise(),
        map(([prev, curr]) => this.getDeltas(prev, curr)),
        map((balances) => [address, balances] as const)
      );
    });

    return combineLatest(pool$)
      .pipe(
        debounceTime(250),
        map((entries) => new Map(entries))
      )
      .subscribe((latest) =>
        this.store.update((state) => this.updateBalances(state, latest))
      );
  }

  private hasSystemAsset(pool: T): boolean {
    return pool.tokens.some((t) => t.id === SYSTEM_ASSET_ID);
  }

  private hasErc20Asset(pool: PoolBase) {
    return pool.tokens.some((t) => t.type === 'Erc20');
  }

  private hasValidAssets(pool: T): boolean {
    return pool.tokens.every(({ decimals, balance }) => {
      return balance > 0n && !!decimals;
    });
  }

  private updateBalances = (
    pools: readonly T[],
    latest: Map<string, AssetBalance[]>
  ): T[] => {
    const updated: T[] = [];
    const poolsMap = new Map(pools.map((p) => [p.address, p]));

    for (const [address, balances] of latest) {
      const pool = poolsMap.get(address);
      if (pool) {
        const tokens = pool.tokens.map((token) => {
          const balance = balances.find((b) => b.id === token.id);
          if (balance && token.id !== pool.id) {
            return {
              ...token,
              balance: balance.balance.transferable,
            };
          }
          return token;
        });
        updated.push({ ...pool, tokens });
      }
    }
    return updated;
  };
}
