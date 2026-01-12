import { PolkadotClient } from 'polkadot-api';

import { memoize1 } from '@thi.ng/memoize';
import { TLRUCache } from '@thi.ng/cache';

import {
  Observable,
  OperatorFunction,
  ReplaySubject,
  Subscription,
  combineLatest,
  defer,
  from,
  merge,
  of,
  EMPTY,
} from 'rxjs';

import {
  bufferCount,
  bufferTime,
  catchError,
  filter,
  finalize,
  map,
  pairwise,
  repeat,
  skip,
  share,
  startWith,
  switchMap,
  tap,
  throttleTime,
} from 'rxjs/operators';

import { BalanceClient } from '../client';
import { SYSTEM_ASSET_ID } from '../consts';
import { EvmClient } from '../evm';
import { AssetBalance } from '../types';
import { async } from '../utils';

import { PoolBase, PoolFees, PoolPair, PoolType } from './types';
import { PoolStore } from './PoolStore';
import { PoolLog } from './PoolLog';

const { withTimeout } = async;

const RESYNC_THROTTLE = 3_000;

export abstract class PoolClient<T extends PoolBase> extends BalanceClient {
  protected evm: EvmClient;
  protected store = new PoolStore<T>();
  protected log: PoolLog;

  private shared$?: Observable<T[]>;

  private resync$ = new ReplaySubject<void>(1);
  private resyncAt = 0;
  private resyncPending = false;

  private mem = 0;
  private memPoolsCache = new TLRUCache<number, Promise<T[]>>(null, {
    ttl: 6 * 1000,
  });

  private memPools = memoize1((mem: number) => {
    this.log.info('pool_sync', { mem });
    return this.loadPools();
  }, this.memPoolsCache);

  constructor(client: PolkadotClient, evm: EvmClient) {
    super(client);
    this.evm = evm;
    this.log = new PoolLog(this.getPoolType());
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
      throttleTime(1_000, undefined, { leading: true, trailing: true })
    );
  }

  private subscribeStore(): Observable<T[]> {
    return defer(() => {
      const session = new Subscription();
      session.add(this.startWatchdog());

      this.resync$.next();

      return this.resync$.pipe(
        switchMap(() => {
          const cycle = new Subscription();

          const seed$ = from(
            withTimeout(this.getMemPools(), 30_000, 'getMemPools stalled')
          ).pipe(
            tap(() => this.log.info('pool_synced', { mem: this.mem })),
            map((pools) => pools.filter((p) => this.hasValidAssets(p))),
            tap((valid) => this.store.set(valid)),
            catchError(() => {
              this.log.error('pool_seed_error', { mem: this.mem });
              this.requestResync(true);
              return EMPTY;
            })
          );

          return seed$.pipe(
            /**
             * After store initialized, attach live writers (fire and forget)
             */
            tap(() => {
              cycle.add(this.subscribeBalances());
              cycle.add(this.subscribeUpdates());
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
              cycle.unsubscribe();
            })
          );
        }),
        finalize(() => session.unsubscribe()),
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
    });
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
        filter((d) => d.length > 0),
        map((balances) => [address, balances] as const)
      );
    });

    return merge(...pool$)
      .pipe(
        bufferTime(250),
        filter((batch) => batch.length > 0),
        map((batch) => new Map(batch)),
        this.watchGuard('balances')
      )
      .subscribe((latest) => {
        this.store.update((state) => this.updateBalances(state, latest));
      });
  }

  protected hasSystemAsset(pool: T): boolean {
    return pool.tokens.some((t) => t.id === SYSTEM_ASSET_ID);
  }

  protected hasErc20Asset(pool: PoolBase) {
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

  /**
   * Invalidates the current seed, tears down all active writers,
   * and rebuilds the store from scratch.
   *
   * - Increments `mem` to bust memoized seeds
   * - Emits on `resync$` to restart the active cycle
   * - Rate-limited by default to avoid resync storms
   * - Use `force` for fatal, state-corrupting errors
   *
   * @param force - bypass the resync throttle
   */
  private resync(force = false) {
    const now = Date.now();
    if (!force && now - this.resyncAt < RESYNC_THROTTLE) return;
    this.resyncAt = now;

    this.mem++;
    this.resync$.next();
  }

  /**
   * Schedules a resync on the next tick.
   *
   * - Ensures the current cycle tears down before resync
   * - Dedup multiple requests occurring in the same tick
   *
   * @param force - forward the force flag to `resync`
   */
  private requestResync(force = false) {
    if (this.resyncPending) return;
    this.resyncPending = true;

    setTimeout(() => {
      this.resyncPending = false;
      this.resync(force);
    }, 0);
  }

  /**
   * Starts the connection and block watchdog.
   *
   * - Triggers a resync on offline → online recovery
   * - Triggers a resync on block gap
   * - Errors are swallowed and the watchdog re-subscribes (`repeat`)
   */
  private startWatchdog(): Subscription {
    const gapThreshold = 3;
    const repeatDelayMs = 1_000;

    const recovery$ = this.watcher.connection$.pipe(
      pairwise(),
      filter(([prev, curr]) => prev === 'offline' && curr === 'online'),
      tap(() => {
        this.log.debug('watchdog_recover_online', { mem: this.mem });
        this.requestResync();
      }),
      catchError((e) => {
        this.log.error('watchdog_recovery_error', e);
        return EMPTY;
      }),
      repeat({ delay: repeatDelayMs })
    );

    const gap$ = this.watcher.finalizedBlock$.pipe(
      pairwise(),
      tap(([prev, curr]) => {
        const p = Number(prev.number);
        const c = Number(curr.number);
        const gap = c - p;

        if (gap >= gapThreshold) {
          this.log.debug('watchdog_gap', { from: p, to: c, gap });
          this.requestResync();
        }
      }),
      catchError((e) => {
        this.log.error('watchdog_gap_error', e);
        return EMPTY;
      }),
      repeat({ delay: repeatDelayMs })
    );

    return merge(recovery$, gap$).subscribe();
  }

  /**
   * Guards a watcher stream.
   *
   * - Logs any error and treats it as fatal
   * - Schedules a forced resync
   * - Outer re-sync cycle handles recovery
   *
   * @param tag - log prefix of the watcher
   */
  protected watchGuard<T>(tag: string): OperatorFunction<T, T> {
    return (source: Observable<T>) =>
      source.pipe(
        tap({
          error: (e) => {
            this.log.error(tag, e);
            this.requestResync(true);
          },
        }),
        finalize(() => {
          this.log.debug(tag, 'unsub');
        }),
        catchError(() => EMPTY)
      );
  }
}
