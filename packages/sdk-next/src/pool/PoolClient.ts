import { PolkadotClient } from 'polkadot-api';

import {
  Observable,
  OperatorFunction,
  ReplaySubject,
  Subject,
  Subscription,
  defer,
  interval,
  merge,
  EMPTY,
} from 'rxjs';

import {
  bufferCount,
  catchError,
  concatMap,
  filter,
  finalize,
  ignoreElements,
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
import { async, QueryCache } from '../utils';

import { PoolBase, PoolFees, PoolPair, PoolType } from './types';
import { PoolStore } from './PoolStore';
import { PoolLog } from './PoolLog';
import {
  AppliedBlock,
  BlockRef,
  ChainTracker,
  DecodedEvent,
  DrivenBlock,
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

  protected log: PoolLog;
  protected store = new PoolStore<T>();
  protected queryCache = new QueryCache();
  protected eventBus = EventBus.shared(this.api);

  /**
   * The block the event stream is currently committing.
   *
   * - `block`: number, feeds the per-block tick and logs
   * - `blockHash`: hash, pins auxiliary reads (fees/oracles) to that block
   */
  protected block = 0;
  protected blockHash?: string;

  /** Blocks this client processed, with the pools it committed */
  private processed$ = new Subject<DrivenBlock>();

  private reconciledAt = 0;

  private shared$?: Observable<T[]>;

  private resync$ = new ReplaySubject<void>(1);
  private resyncAt = 0;
  private resyncPending = false;

  private mem = 0;

  constructor(client: PolkadotClient, evm: EvmClient, at?: BlockAt) {
    super(client, at);
    this.evm = evm;
    this.balance = new BalanceClient(client, at);
    this.log = new PoolLog(this.getPoolType());
  }

  abstract isSupported(): Promise<boolean>;
  abstract getPoolFees(pair: PoolPair, address: string): Promise<PoolFees>;
  abstract getPoolType(): PoolType;

  /**
   * Load a full, coherent pool set PINNED at one block.
   *
   * - All reads use `at` so the snapshot can't tear across blocks
   * - Drives both the initial seed and consumer `getPools`
   *
   * @param at - block hash (or tag) to pin every read to
   */
  protected abstract loadPools(at: BlockAt): Promise<T[]>;

  /**
   * Event handlers that produce store mutations.
   *
   * - Each maps a matched `System.Events` record to pool mutation(s)
   * - Reads any counterpart slice pinned at the event's block
   */
  protected syncHandlers(): PoolEventHandler<T>[] {
    return [];
  }

  /**
   * Event effects — side effects on the same stream, no store write.
   *
   * - Refresh a cache, stash params, request a resync
   * - Run before the block's handlers and tick
   */
  protected syncEffects(): PoolEventEffect[] {
    return [];
  }

  /**
   * Per-block recompute for values that drift between events.
   *
   * - e.g. amp & weight ramp, peg convergence
   * - Returned mutations commit in the same block commit as event mutations
   *
   * @param _block - the block being committed
   * @param _source - source pools committed at that block, for a derived pool
   */
  protected async tickMutations(
    _block: BlockRef,
    _source: readonly PoolBase[] = []
  ): Promise<PoolMutation<T>[]> {
    return [];
  }

  /**
   * Cadence gate for the periodic reserve reconcile.
   *
   * - Delegates to `reconcileBalances` once every `erc20SafetyRereadBlocks`
   * - Returns no mutations between reconcile blocks
   *
   * @param block - the block being committed
   */
  private async balanceMutations(block: BlockRef): Promise<PoolMutation<T>[]> {
    const cadence = this.balance.erc20SafetyRereadBlocks;
    if (block.number - this.reconciledAt < cadence) return [];
    this.reconciledAt = block.number;
    return this.reconcileBalances(block);
  }

  /**
   * Periodic re-read of erc20 reserve balances that accrue with no event.
   *
   * - The coherent seed + event stream keep everything else exact; only
   *   interest-bearing (aToken) reserves drift every block without an event
   * - Reads every erc20 reserve at `pool.address`; commits only what changed
   * - Overridden where reserves live off-pool or are read via an executor
   *
   * @param block - the block being committed; reads pin at `block.hash`
   */
  protected async reconcileBalances(
    block: BlockRef
  ): Promise<PoolMutation<T>[]> {
    const muts: PoolMutation<T>[] = [];

    for (const pool of this.store.pools) {
      const erc20 = pool.tokens.filter((t) => t.type === 'Erc20');
      if (erc20.length === 0) continue;

      const fresh = await Promise.all(
        erc20.map(async (t) => ({
          id: t.id,
          balance: (
            await this.balance.getBalanceAt(pool.address, t.id, block.hash)
          ).transferable,
        }))
      );
      const changed = fresh.filter((f) => {
        const cur = pool.tokens.find((t) => t.id === f.id);
        return cur !== undefined && cur.balance !== f.balance;
      });
      if (changed.length === 0) continue;

      muts.push({
        address: pool.address,
        apply: (p) => ({
          ...p,
          tokens: p.tokens.map((t) => {
            const c = changed.find((x) => x.id === t.id);
            return c ? { ...t, balance: c.balance } : t;
          }),
        }),
      });
    }

    return muts;
  }

  /**
   * Load and publish a coherent pool set PINNED at `at`.
   *
   * - Defaults to `this.at` (a fixed block for consumer-created clients)
   * - Seeds the store; used ad-hoc by consumers and by derived clients
   *
   * @param at - block hash (or tag) to pin every read to
   */
  async getPools(at: BlockAt = this.at): Promise<T[]> {
    const pools = await this.loadPools(at);
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
      filter((arr) => arr.length > 0)
    );
  }

  /**
   * Per-block feed this client drives off.
   *
   * - Default: the shared `System.Events` stream, carrying no source pools
   * - A derived client overrides it with its source's processed feed, so it
   *   receives a block only after the source committed it
   */
  protected blockSource(): Observable<DrivenBlock> {
    return this.eventBus
      .watchBlockEvents()
      .pipe(map((e) => ({ ...e, changed: [] })));
  }

  /**
   * Processed-block feed for a derived client.
   *
   * - Delivers a block only after this client committed it, carrying what it
   *   committed — so a derived pool folds source state belonging to THAT
   *   block, not whatever the source holds by the time it looks
   * - Ref-counts this client's sync cycle without consuming pool emissions
   */
  processedBlocks(): Observable<DrivenBlock> {
    return defer(() => {
      if (!this.shared$) {
        this.shared$ = this.subscribeStore();
      }
      return merge(this.shared$.pipe(ignoreElements()), this.processed$);
    });
  }

  private subscribeStore(): Observable<T[]> {
    return defer(() => {
      const session = new Subscription();
      session.add(this.startWatchdog());

      this.resync$.next();

      return this.resync$.pipe(
        switchMap(() => {
          const cycle = new Subscription();

          /**
           * ONE stream seeds AND drives. Its first block pins the seed, the
           * rest commit per-block ({@link subscribeEvents}).
           */
          cycle.add(this.subscribeEvents());

          /**
           * Drop the BehaviorSubject replay (stale prior-cycle state); the
           * first real emission is the fresh pinned seed set by the driver.
           */
          return this.store.asObservable().pipe(
            skip(1),
            finalize(() => cycle.unsubscribe())
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
   * Seeds AND drives pool sync from a single `System.Events` stream.
   *
   * - The stream's FIRST block pins the seed: `loadPools(block.hash)` is one
   *   coherent snapshot; its own events aren't re-applied
   * - Each later block commits effects + handlers + tick in one `update`
   * - `at:'best'` delivers the latest best (not every block) on a fork-prone
   *   chain; the {@link ChainTracker} classifies each block into a gap to
   *   backfill or a reorg whose window is re-derived at the new tip
   */
  protected subscribeEvents(): Subscription {
    let seeded = false;
    let handlers: PoolEventHandler<T>[] = [];
    let effects: PoolEventEffect[] = [];

    const chain = new ChainTracker(this.client);

    /**
     * Resolve one block's mutations: effects + handlers + tick.
     *
     * - Reads slices PINNED at `block.hash`
     * - Runs effects in order (they refresh the caches the tick reads)
     * - Returns the muts plus the events that drove it (kept for reorg replay);
     *   the caller commits the whole window in one `update`
     */
    const resolve = async (
      block: BlockRef,
      events: DecodedEvent[],
      source: readonly PoolBase[] = []
    ): Promise<{ muts: PoolMutation<T>[]; touched: DecodedEvent[] }> => {
      const touched: DecodedEvent[] = [];
      const effectsRes: Promise<void>[] = [];
      const handlersRes: Promise<PoolMutation<T>[]>[] = [];

      for (const e of events) {
        let hit = false;
        for (const x of effects) {
          if (x.match(e)) {
            effectsRes.push(x.apply(e, block));
            hit = true;
          }
        }
        for (const h of handlers) {
          if (h.match(e)) {
            handlersRes.push(h.resolve(e, block));
            hit = true;
          }
        }
        if (hit) touched.push(e);
      }

      await Promise.all(effectsRes);
      const eventMuts = (await Promise.all(handlersRes)).flat();
      const tickMuts = await this.tickMutations(block, source);
      const balanceMuts = await this.balanceMutations(block);

      return { muts: [...eventMuts, ...tickMuts, ...balanceMuts], touched };
    };

    /**
     * Re-derive `events` at `block`: effects, then handlers.
     *
     * - Effects refresh the caches the tick reads (oracles, pegs) at `block`
     * - Handlers re-read the touched assets at `block`
     */
    const reread = async (
      events: DecodedEvent[],
      block: BlockRef
    ): Promise<PoolMutation<T>[]> => {
      const effectsRes: Promise<void>[] = [];
      for (const e of events) {
        for (const x of effects) {
          if (x.match(e)) effectsRes.push(x.apply(e, block));
        }
      }
      await Promise.all(effectsRes);

      const handlersRes: Promise<PoolMutation<T>[]>[] = [];
      for (const e of events) {
        for (const h of handlers) {
          if (h.match(e)) handlersRes.push(h.resolve(e, block));
        }
      }
      return (await Promise.all(handlersRes)).flat();
    };

    return this.blockSource()
      .pipe(
        concatMap(async ({ block, events, changed }) => {
          if (!seeded) {
            try {
              const pools = await withTimeout(
                this.loadPools(block.hash),
                60_000,
                'seed stalled'
              );
              this.block = block.number;
              this.blockHash = block.hash;
              this.store.set(pools.filter((p) => this.hasValidAssets(p)));
              /**
               * Build after seed so handlers/effects see a populated store.
               */
              handlers = this.syncHandlers();
              effects = this.syncEffects();
              seeded = true;
              chain.seed(block);
              /**
               * Forward the seed block so a derived client seeds at the same
               * block; its own pinned seed covers the source state.
               */
              this.processed$.next({ block, events, changed: [] });
              this.log.info('pool_synced', {
                mem: this.mem,
                block: block.number,
              });
            } catch {
              this.log.error('pool_seed_error', { mem: this.mem });
              this.requestResync();
            }
            return;
          }

          /**
           * Classify against what we've applied: a forward gap to backfill, or
           * a reorg where the tip we applied is no longer on chain.
           */
          const { missed, reorg } = await chain.classify(block);

          const muts: PoolMutation<T>[] = [];

          /**
           * Canonical blocks between our tip and this one, replayed in order and
           * committed together (each read pinned at its own block).
           *
           * - Remembered only after the reorg heal, so the heal classifies
           *   against the history that was actually applied
           */
          const backfilled: AppliedBlock[] = [];
          for (const m of missed) {
            const { muts: mm, touched } = await resolve(
              m,
              await this.eventBus.eventsAt(m.hash)
            );
            muts.push(...mm);
            backfilled.push({ number: m.number, hash: m.hash, touched });
          }

          /**
           * Heal the reorg at the new tip.
           *
           * - Replay BOTH sides of the fork: events applied on the orphaned
           *   suffix AND events of the canonical blocks that displaced it,
           *   which this driver never saw
           * - Handlers re-read absolute state at the tip, so one pass heals
           *   fork residue and applies the displaced blocks
           * - Repair the ring: drop orphaned entries, splice in the canonical
           *   replacements, so a later reorg can't replay stale residue
           */
          if (reorg) {
            const { orphaned, canonical } = await chain.split(block);

            const replaced: AppliedBlock[] = [];
            for (const c of canonical) {
              const events = await this.eventBus.eventsAt(c.hash);
              const touched = events.filter(
                (e) =>
                  effects.some((x) => x.match(e)) ||
                  handlers.some((h) => h.match(e))
              );
              replaced.push({ number: c.number, hash: c.hash, touched });
            }

            const union = [
              ...orphaned.flatMap((b) => b.touched),
              ...replaced.flatMap((b) => b.touched),
            ];
            const healed = await reread(union, block);
            this.log.debug('reorg', {
              at: block.number,
              depth: orphaned.length,
              canon: replaced.length,
              replayed: union.length,
              muts: healed.length,
              blocks: orphaned.map((b) => b.number).sort((a, b) => a - b),
            });
            muts.push(...healed);

            chain.repair(orphaned, replaced);
          }

          const { muts: cur, touched } = await resolve(block, events, changed);
          muts.push(...cur);

          /**
           * Commit the window in one update; advance the cursor INSIDE it so
           * `this.block`/`this.blockHash` stay coherent with the emission.
           *
           * - Commit on a reorg even with no muts, so the cursor leaves the
           *   orphaned hash (an empty changeset emits nothing downstream)
           * - Forward the block once committed, carrying the pools it changed
           */
          if (muts.length > 0 || reorg) {
            this.store.update((state) => {
              this.block = block.number;
              this.blockHash = block.hash;
              const updated = this.applyMutations(state, muts);
              this.processed$.next({ block, events, changed: updated });
              return updated;
            });
          } else {
            /**
             * Processed with nothing to commit — a derived client still needs
             * the block to apply its OWN events.
             */
            this.processed$.next({ block, events, changed: [] });
          }

          for (const b of backfilled) chain.remember(b);
          chain.apply(block, touched);
        }),
        this.watchGuard('events')
      )
      .subscribe();
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
