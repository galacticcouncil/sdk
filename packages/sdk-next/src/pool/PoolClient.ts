import { PolkadotClient } from 'polkadot-api';

import { memoize1 } from '@thi.ng/memoize';
import { TLRUCache } from '@thi.ng/cache';

import {
  Observable,
  OperatorFunction,
  ReplaySubject,
  Subscription,
  defer,
  from,
  interval,
  merge,
  of,
  EMPTY,
} from 'rxjs';

import {
  bufferCount,
  catchError,
  concatMap,
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

import { BlockAt, Papi } from '../api';
import { BalanceClient } from '../client';
import { EvmClient } from '../evm';
import { async } from '../utils';

import { PoolBase, PoolFees, PoolPair, PoolType } from './types';
import { PoolStore } from './PoolStore';
import { PoolLog } from './PoolLog';
import {
  BlockRef,
  EventBus,
  PoolEventEffect,
  PoolEventHandler,
  PoolMutation,
} from './events';

const { withTimeout } = async;

const RESYNC_THROTTLE = 3_000;

export abstract class PoolClient<T extends PoolBase> extends Papi {
  protected evm: EvmClient;
  protected balance: BalanceClient;

  protected store = new PoolStore<T>();
  protected log: PoolLog;
  protected eventBus = new EventBus(this.api);

  /**
   * The block the event stream is currently committing.
   */
  protected block = 0;

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

  constructor(client: PolkadotClient, evm: EvmClient, at?: BlockAt) {
    super(client, at);
    this.evm = evm;
    this.balance = new BalanceClient(client, at);
    this.log = new PoolLog(this.getPoolType());
  }

  abstract isSupported(): Promise<boolean>;
  abstract getPoolFees(pair: PoolPair, address: string): Promise<PoolFees>;
  abstract getPoolType(): PoolType;
  protected abstract loadPools(): Promise<T[]>;

  /**
   * Event handlers that produce store mutations.
   *
   * - Each maps a matched `System.Events` record to pool mutation(s)
   * - Reads any counterpart slice pinned at the event's block
   * - Default none
   */
  protected syncHandlers(): PoolEventHandler<T>[] {
    return [];
  }

  /**
   * Event effects — side effects on the same stream, no store write.
   *
   * - Refresh a cache, stash params, request a resync
   * - Run before the block's handlers and tick
   * - Default none
   */
  protected syncEffects(): PoolEventEffect[] {
    return [];
  }

  /**
   * Per-block recompute for values that drift between events.
   *
   * - e.g. stableswap amp ramp / peg convergence, LBP weight ramp
   * - Returned mutations commit in the same block commit as event mutations
   */
  protected async tickMutations(_block: BlockRef): Promise<PoolMutation<T>[]> {
    return [];
  }

  private async getMemPools(): Promise<T[]> {
    return this.memPools(this.mem);
  }

  async getPools(): Promise<T[]> {
    const pools = await this.getMemPools();
    const valid = pools.filter((p) => this.hasValidAssets(p));
    this.store.set(valid);
    return valid;
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
            withTimeout(this.getMemPools(), 60_000, 'getMemPools stalled')
          ).pipe(
            tap(() => this.log.info('pool_synced', { mem: this.mem })),
            map((pools) => pools.filter((p) => this.hasValidAssets(p))),
            tap((valid) => this.store.set(valid)),
            catchError(() => {
              this.log.error('pool_seed_error', { mem: this.mem });
              this.requestResync();
              return EMPTY;
            })
          );

          return seed$.pipe(
            /**
             * After store initialized, attach live writers (fire and forget).
             *
             * ONE event-driven writer. One commit per block covering:
             *  - effects
             *  - event mutations
             *  - per-block tick
             *
             * Supplementary reactive writer ({@link subscribeUpdates})
             */
            tap(() => {
              cycle.add(
                this.subscribeEvents(this.syncHandlers(), this.syncEffects())
              );
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
        finalize(() => session.unsubscribe())
      );
    }).pipe(
      /**
       * Ensures single internal wiring for all subscribers.
       */
      share({
        /**
         * Late subscribers get the latest snapshot immediately from the
         * connector's buffer, even if upstream hasn't emitted again yet
         * in this ref-count cycle
         */
        connector: () => new ReplaySubject<T[]>(1),
        resetOnRefCountZero: true,
      })
    );
  }

  /**
   * Drives pool sync from `System.Events`, one commit per block.
   *
   * - Advance `this.block` to the block being committed
   * - Run matching `effects` (cache/param refreshes) first
   * - Resolve matching `handlers` into mutations, reading slices PINNED at `block.hash`
   * - Append the per-block `tickMutations`
   * - Commit them all in one `store.update`
   * - `concatMap` serializes blocks, so commits stay in block order
   */
  protected subscribeEvents(
    handlers: PoolEventHandler<T>[],
    effects: PoolEventEffect[]
  ): Subscription {
    return this.eventBus
      .watchBlockEvents()
      .pipe(
        concatMap(async ({ block, events }) => {
          this.block = block.number;
          const effectsRes = events.flatMap((e) =>
            effects.filter((x) => x.match(e)).map((x) => x.apply(e, block))
          );
          const handlersRes = events.flatMap((e) =>
            handlers.filter((h) => h.match(e)).map((h) => h.resolve(e, block))
          );
          await Promise.all(effectsRes);
          const eventMuts = await Promise.all(handlersRes);
          const tickMuts = await this.tickMutations(block);
          return { muts: [...eventMuts.flat(), ...tickMuts] };
        }),
        filter(({ muts }) => muts.length > 0),
        this.watchGuard('events')
      )
      .subscribe(({ muts }) => {
        this.store.update((state) => this.applyMutations(state, muts));
      });
  }

  /**
   * Supplementary reactive writer, run alongside the event driver.
   *
   * - For a derived pool merging a sibling's coherent snapshot (HSM ← Stableswap)
   * - Writes disjoint fields, so it can't tear against the driver's commits
   */
  protected subscribeUpdates(): Subscription {
    return Subscription.EMPTY;
  }

  /**
   * Fold each pool through its mutations' `apply`, grouped by address.
   *
   * - Return only the touched pools
   * - Skip unknown pools; structural add/remove is handled via `requestResync`
   */
  private applyMutations(state: readonly T[], muts: PoolMutation<T>[]): T[] {
    const byAddress = new Map<string, PoolMutation<T>[]>();
    for (const m of muts) {
      const list = byAddress.get(m.address);
      if (list) list.push(m);
      else byAddress.set(m.address, [m]);
    }

    const current = new Map(state.map((p) => [p.address, p]));
    const updated: T[] = [];
    for (const [address, list] of byAddress) {
      let pool = current.get(address);
      if (!pool) continue;
      for (const m of list) pool = m.apply(pool);
      updated.push(pool);
    }
    return updated;
  }

  private hasValidAssets(pool: T): boolean {
    return pool.tokens.every(({ decimals, balance }) => {
      if (pool.type === PoolType.XYK) {
        return balance > 0n && !!decimals;
      }
      return !!decimals;
    });
  }

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
  protected requestResync(force = false) {
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
    const resyncIntervalMs = 60 * 60 * 1_000; // 60 min

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

    const periodic$ = interval(resyncIntervalMs).pipe(
      tap(() => {
        this.log.debug('watchdog_periodic', { mem: this.mem });
        this.requestResync();
      }),
      catchError((e) => {
        this.log.error('watchdog_periodic_error', e);
        return EMPTY;
      }),
      repeat({ delay: repeatDelayMs })
    );

    return merge(recovery$, gap$, periodic$).subscribe();
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
