import { PolkadotClient } from 'polkadot-api';

import { Observable, ReplaySubject, defer } from 'rxjs';

import {
  bufferCount,
  filter,
  finalize,
  map,
  skip,
  share,
  startWith,
} from 'rxjs/operators';

import { BlockAt, Papi } from '../api';
import { BalanceClient } from '../client';
import { EvmClient } from '../evm';
import { async, QueryCache } from '../utils';

import { PoolBase, PoolFees, PoolPair, PoolType } from './types';
import { PoolStore } from './PoolStore';
import { PoolLog } from './PoolLog';
import { PoolSync } from './PoolSync';
import {
  BlockContext,
  BlockRef,
  DecodedEvent,
  PoolEventEffect,
  PoolEventHandler,
  PoolMutation,
} from './events';

const { withTimeout } = async;

/**
 * Applied blocks whose matched events are kept for a reorg replay.
 *
 * - A reorg can't reach below finalized, and the feed's window spans
 *   best → finalized (~15 blocks at 30s finality), so this bounds it
 */
const REPLAY_DEPTH = 16;

export abstract class PoolClient<T extends PoolBase> extends Papi {
  protected evm: EvmClient;
  protected balance: BalanceClient;

  protected log: PoolLog;
  protected store = new PoolStore<T>();
  protected queryCache = new QueryCache();

  /**
   * The block the event stream is currently committing.
   *
   * - `block`: number, feeds the per-block tick and logs
   * - `blockHash`: hash, pins auxiliary reads (fees/oracles) to that block
   * - `blockMatched`: events this client matched, keyed by block hash; bounded
   *   ring that feeds the orphaned-side replay on a reorg
   * - `blockQueue`: passes apply one at a time, in delivery order
   */
  protected block = 0;
  protected blockHash?: string;
  private blockMatched = new Map<string, DecodedEvent[]>();
  private blockQueue: Promise<void> = Promise.resolve();

  private seedCount = 0;
  private isSeeded = false;

  private eventHandlers: PoolEventHandler<T>[] = [];
  private eventEffects: PoolEventEffect[] = [];

  private reconciledAt = 0;

  private pools$?: Observable<T[]>;

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
   * Clients whose committed state this pool derives from.
   *
   * - {@link PoolSync} orders sources first and makes this client's block
   *   commit wait for theirs — the ONLY wait in the driver
   */
  dependencies(): PoolClient<any>[] {
    return [];
  }

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
   * - A derived pool merges its source's slice here; the driver has already
   *   committed the source's block by the time this runs
   * - Returned mutations commit in the same block commit as event mutations
   *
   * @param _block - the block being committed
   */
  protected async tickMutations(_block: BlockRef): Promise<PoolMutation<T>[]> {
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
    const muts = await Promise.all(
      this.store.pools.map(
        async (pool): Promise<PoolMutation<T> | undefined> => {
          const erc20 = pool.tokens.filter((t) => t.type === 'Erc20');
          if (erc20.length === 0) return undefined;

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
          if (changed.length === 0) return undefined;

          return {
            address: pool.address,
            apply: (p: T) => ({
              ...p,
              tokens: p.tokens.map((t) => {
                const c = changed.find((x) => x.id === t.id);
                return c ? { ...t, balance: c.balance } : t;
              }),
            }),
          };
        }
      )
    );

    return muts.filter((m): m is PoolMutation<T> => m !== undefined);
  }

  /**
   * The committed pool set.
   *
   * - Coherent with `block` / `blockHash`
   * - A derived pool reads its source's pools through this
   */
  get pools(): readonly T[] {
    return this.store.pools;
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

  /**
   * Live pool stream, driven by {@link PoolSync}.
   *
   * - Only the best chain can be followed live; any other `at` is a fixed read
   *   target whose store would drift off its own pin
   */
  getSubscriber(): Observable<T[]> {
    if (this.at !== 'best') {
      throw new Error(`Live sync requires at 'best', got '${this.at}'`);
    }

    if (!this.pools$) {
      this.pools$ = this.subscribeStore();
    }

    return this.pools$.pipe(
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
   * Queue one block behind this client's in-flight work.
   *
   * - Driven by {@link PoolSync}; not a consumer API
   * - `deps` are the sources' completions for THE SAME block, passed down so
   *   this client's own effects and handlers run while they resolve
   * - Failures are contained: log, reseed, and the queue continues, so a
   *   dependent is never stuck waiting on a broken source
   *
   * @param ctx - the pass's shared sync context
   * @param deps - sources' completion promises for this pass
   */
  syncBlock(ctx: BlockContext, deps: Promise<unknown>[]): Promise<void> {
    this.blockQueue = this.blockQueue
      .then(() => this.applyBlock(ctx, Promise.all(deps)))
      .catch((e) => {
        this.log.error('sync_error', e);
        this.syncReset();
      });

    return this.blockQueue;
  }

  /**
   * Drop sync state so the next block reseeds.
   *
   * - Driven by {@link PoolSync}; not a consumer API
   */
  syncReset(): void {
    this.isSeeded = false;
    this.blockMatched.clear();
  }

  /**
   * Requests a fresh seed on the next delivered block.
   *
   * - For structural changes the event stream can't patch (pool added/removed)
   * - The driver reseeds this client only; siblings keep their state
   */
  protected requestResync() {
    PoolSync.shared(this.client).reseed(this);
  }

  private subscribeStore(): Observable<T[]> {
    return defer(() => {
      const sub = PoolSync.shared(this.client).register(this);

      /**
       * Drop the BehaviorSubject replay (stale prior state); the first real
       * emission is the fresh pinned seed.
       */
      return this.store.asObservable().pipe(
        skip(1),
        finalize(() => sub.unsubscribe())
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
   * Seed, then resolve and commit one pass.
   *
   * - The FIRST block pins the seed: `loadPools(block.hash)` is one coherent
   *   snapshot; its own events aren't re-applied
   * - Blocks under the tip (gap-filled or reorg-replaced) and the events this
   *   client matched on orphaned blocks are replayed ONCE at the tip, not per
   *   block: handlers re-read absolute state, so only the newest read matters
   * - Everything commits in one `update`, awaited so a dependent can read this
   *   store afterwards
   *
   * @param ctx - the pass's shared sync context
   * @param ready - sources' completions; awaited before the tick only
   */
  private async applyBlock(
    ctx: BlockContext,
    ready: Promise<unknown>
  ): Promise<void> {
    if (!this.isSeeded) return this.seed(ctx.block);

    const muts: PoolMutation<T>[] = [];
    const replay: DecodedEvent[] = [];

    /**
     * Blocks under the tip: keep what this client matched for a later reorg,
     * and stage it for the replay.
     */
    const below: { hash: string; touched: DecodedEvent[] }[] = [];
    for (const b of ctx.below) {
      const events = await ctx.eventsOf(b);
      const touched = events.filter((e) => this.matches(e));
      below.push({ hash: b.hash, touched });
      replay.push(...touched);
    }

    /**
     * Orphaned side: what THIS client matched there, then drop it so a later
     * reorg can't replay stale residue.
     */
    for (const o of ctx.orphaned) {
      const matched = this.blockMatched.get(o.hash) ?? [];
      replay.push(...matched);
      this.blockMatched.delete(o.hash);
    }

    if (replay.length > 0) {
      const healed = await this.reread(replay, ctx.block);
      this.log.debug('block_replay', {
        at: ctx.block.number,
        below: ctx.below.length,
        orphaned: ctx.orphaned.length,
        events: replay.length,
        muts: healed.length,
      });
      muts.push(...healed);
    }

    const { muts: cur, touched } = await this.resolve(ctx.block, ctx.events);
    muts.push(...cur);

    /**
     * Own work is done; only the tick can need a source's block.
     */
    await ready;

    const tickMuts = await this.tickMutations(ctx.block);
    const balanceMuts = await this.balanceMutations(ctx.block);
    muts.push(...tickMuts, ...balanceMuts);

    /**
     * Commit the pass in one update; advance the cursor INSIDE it so
     * `block`/`blockHash` stay coherent with the emission.
     *
     * - Commit on a reorg even with no muts, so the cursor leaves the
     *   orphaned hash (an empty changeset emits nothing downstream)
     */
    if (muts.length > 0 || ctx.orphaned.length > 0) {
      await this.store.update((state) => {
        this.block = ctx.block.number;
        this.blockHash = ctx.block.hash;
        return this.applyMutations(state, muts);
      });
    }

    for (const b of below) this.remember(b.hash, b.touched);
    this.remember(ctx.block.hash, touched);
  }

  /**
   * Build a coherent snapshot PINNED at `block`.
   *
   * - Handlers/effects are built after the seed so they see a populated store
   * - On failure the client stays unseeded and retries on the next block
   */
  private async seed(block: BlockRef): Promise<void> {
    try {
      const pools = await withTimeout(
        this.loadPools(block.hash),
        60_000,
        'seed stalled'
      );
      this.block = block.number;
      this.blockHash = block.hash;
      this.store.set(pools.filter((p) => this.hasValidAssets(p)));
      this.eventHandlers = this.syncHandlers();
      this.eventEffects = this.syncEffects();
      this.blockMatched.clear();
      this.isSeeded = true;
      this.log.info('pool_synced', {
        seed: this.seedCount++,
        block: block.number,
      });
    } catch {
      this.log.error('pool_seed_error', { seed: this.seedCount });
    }
  }

  /**
   * Resolve what one block's events dirtied: effects, then handlers.
   *
   * - Reads slices PINNED at `block.hash`
   * - Runs effects first (they refresh the caches the tick reads)
   * - Returns the muts plus the events that drove them (kept for reorg replay);
   *   the caller adds the tick and commits the whole pass in one `update`
   *
   * @param block - the block to resolve, pinning every read
   * @param events - that block's events
   */
  private async resolve(
    block: BlockRef,
    events: DecodedEvent[]
  ): Promise<{ muts: PoolMutation<T>[]; touched: DecodedEvent[] }> {
    const t0 = performance.now();
    const touched: DecodedEvent[] = [];
    const effectsRes: Promise<void>[] = [];
    const handlersRes: Promise<PoolMutation<T>[]>[] = [];

    for (const e of events) {
      let hit = false;
      for (const x of this.eventEffects) {
        if (x.match(e)) {
          effectsRes.push(x.apply(e, block));
          hit = true;
        }
      }
      for (const h of this.eventHandlers) {
        if (h.match(e)) {
          handlersRes.push(h.resolve(e, block));
          hit = true;
        }
      }
      if (hit) touched.push(e);
    }

    await Promise.all(effectsRes);
    const eventMuts = (await Promise.all(handlersRes)).flat();

    if (touched.length > 0) {
      this.log.debug('block_resolve', {
        events: events.length,
        matched: touched.length,
        muts: eventMuts.length,
        ms: Math.round(performance.now() - t0),
      });
    }

    return { muts: eventMuts, touched };
  }

  /**
   * Re-derive `events` at `block`: effects, then handlers.
   *
   * - Effects refresh the caches the tick reads (oracles, pegs) at `block`
   * - Handlers re-read the touched assets at `block`
   */
  private async reread(
    events: DecodedEvent[],
    block: BlockRef
  ): Promise<PoolMutation<T>[]> {
    const effectsRes: Promise<void>[] = [];
    for (const e of events) {
      for (const x of this.eventEffects) {
        if (x.match(e)) effectsRes.push(x.apply(e, block));
      }
    }
    await Promise.all(effectsRes);

    const handlersRes: Promise<PoolMutation<T>[]>[] = [];
    for (const e of events) {
      for (const h of this.eventHandlers) {
        if (h.match(e)) handlersRes.push(h.resolve(e, block));
      }
    }
    return (await Promise.all(handlersRes)).flat();
  }

  /** Whether any handler or effect of this client matches the event */
  private matches(e: DecodedEvent): boolean {
    return (
      this.eventEffects.some((x) => x.match(e)) ||
      this.eventHandlers.some((h) => h.match(e))
    );
  }

  /**
   * Ring insert of the events this client matched at a block.
   *
   * - Bounded by `REPLAY_DEPTH`; oldest entry drops first
   */
  private remember(hash: string, touched: DecodedEvent[]): void {
    this.blockMatched.set(hash, touched);
    if (this.blockMatched.size > REPLAY_DEPTH) {
      const oldest = this.blockMatched.keys().next().value;
      if (oldest !== undefined) this.blockMatched.delete(oldest);
    }
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
}
