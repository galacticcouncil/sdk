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
  REORG_DEPTH,
} from './events';

const { withTimeout } = async;

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
   */
  protected block = 0;
  protected blockHash?: string;

  private seeded = false;
  private handlers: PoolEventHandler<T>[] = [];
  private effects: PoolEventEffect[] = [];

  /**
   * Events THIS client matched, per applied block hash.
   *
   * - Bounded ring; feeds the orphaned-side replay on a reorg
   */
  private applied = new Map<string, DecodedEvent[]>();

  /** Serial per-block queue; blocks apply in delivery order */
  private queue: Promise<void> = Promise.resolve();

  private reconciledAt = 0;

  private shared$?: Observable<T[]>;

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
   * The committed pool set.
   *
   * - Coherent with `block` / `blockHash`
   * - A derived pool reads its source's pools through this
   */
  get pools(): readonly T[] {
    return this.store.pools;
  }

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
   * Queue one block behind this client's in-flight work.
   *
   * - Driven by {@link PoolSync}; not a consumer API
   * - `deps` are the sources' completions for THE SAME block, passed down so
   *   this client's own effects and handlers run while they resolve
   * - Failures are contained: log, reseed, and the queue continues, so a
   *   dependent is never stuck waiting on a broken source
   *
   * @param ctx - the block's shared sync context
   * @param deps - sources' completion promises for this block
   */
  syncBlock(ctx: BlockContext, deps: Promise<unknown>[]): Promise<void> {
    this.queue = this.queue
      .then(() => this.applyBlock(ctx, Promise.all(deps)))
      .catch((e) => {
        this.log.error('sync_error', e);
        this.syncReset();
      });

    return this.queue;
  }

  /**
   * Drop sync state so the next block reseeds.
   *
   * - Driven by {@link PoolSync}; not a consumer API
   */
  syncReset(): void {
    this.seeded = false;
    this.applied.clear();
  }

  /**
   * Requests a fresh seed on the next delivered block.
   *
   * - For structural changes the event stream can't patch (pool added/removed)
   * - The driver reseeds this client only; siblings keep their state
   */
  protected requestResync() {
    PoolSync.shared(this.client, this.at).reseed(this);
  }

  private subscribeStore(): Observable<T[]> {
    return defer(() => {
      const sub = PoolSync.shared(this.client, this.at).register(this);

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
   * Seed, then resolve and commit one block.
   *
   * - The FIRST block pins the seed: `loadPools(block.hash)` is one coherent
   *   snapshot; its own events aren't re-applied
   * - Later blocks commit backfill + heal + effects/handlers/tick in one
   *   `update`, awaited so a dependent can read this store afterwards
   *
   * @param ctx - the block's shared sync context
   * @param ready - sources' completions; awaited before the tick only
   */
  private async applyBlock(
    ctx: BlockContext,
    ready: Promise<unknown>
  ): Promise<void> {
    if (!this.seeded) return this.seed(ctx.block);

    const muts: PoolMutation<T>[] = [];

    /**
     * Canonical blocks between the tip and this one, replayed in order and
     * committed together (each read pinned at its own block).
     */
    const backfilled: { hash: string; touched: DecodedEvent[] }[] = [];
    for (const m of ctx.missed) {
      const { muts: mm, touched } = await this.resolve(
        m,
        await ctx.eventsOf(m)
      );
      muts.push(...mm);
      backfilled.push({ hash: m.hash, touched });
    }

    if (ctx.reorg) muts.push(...(await this.heal(ctx)));

    const { muts: cur, touched } = await this.resolve(
      ctx.block,
      ctx.events,
      ready
    );
    muts.push(...cur);

    /**
     * Commit the window in one update; advance the cursor INSIDE it so
     * `block`/`blockHash` stay coherent with the emission.
     *
     * - Commit on a reorg even with no muts, so the cursor leaves the
     *   orphaned hash (an empty changeset emits nothing downstream)
     */
    if (muts.length > 0 || ctx.reorg) {
      await this.store.update((state) => {
        this.block = ctx.block.number;
        this.blockHash = ctx.block.hash;
        return this.applyMutations(state, muts);
      });
    }

    for (const b of backfilled) this.remember(b.hash, b.touched);
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
      this.handlers = this.syncHandlers();
      this.effects = this.syncEffects();
      this.applied.clear();
      this.seeded = true;
      this.log.info('pool_synced', { mem: this.mem++, block: block.number });
    } catch {
      this.log.error('pool_seed_error', { mem: this.mem });
    }
  }

  /**
   * Resolve one block's mutations: effects + handlers + tick.
   *
   * - Reads slices PINNED at `block.hash`
   * - Runs effects in order (they refresh the caches the tick reads)
   * - Returns the muts plus the events that drove it (kept for reorg replay);
   *   the caller commits the whole window in one `update`
   *
   * @param block - the block to resolve, pinning every read
   * @param events - that block's events
   * @param ready - sources' completions, awaited before the tick
   */
  private async resolve(
    block: BlockRef,
    events: DecodedEvent[],
    ready?: Promise<unknown>
  ): Promise<{ muts: PoolMutation<T>[]; touched: DecodedEvent[] }> {
    const touched: DecodedEvent[] = [];
    const effectsRes: Promise<void>[] = [];
    const handlersRes: Promise<PoolMutation<T>[]>[] = [];

    for (const e of events) {
      let hit = false;
      for (const x of this.effects) {
        if (x.match(e)) {
          effectsRes.push(x.apply(e, block));
          hit = true;
        }
      }
      for (const h of this.handlers) {
        if (h.match(e)) {
          handlersRes.push(h.resolve(e, block));
          hit = true;
        }
      }
      if (hit) touched.push(e);
    }

    await Promise.all(effectsRes);
    const eventMuts = (await Promise.all(handlersRes)).flat();

    /**
     * Own work is done; only the tick can need a source's block.
     */
    if (ready) await ready;

    const tickMuts = await this.tickMutations(block);
    const balanceMuts = await this.balanceMutations(block);

    return { muts: [...eventMuts, ...tickMuts, ...balanceMuts], touched };
  }

  /**
   * Heal a reorg at the new tip.
   *
   * - Replays BOTH sides of the fork: the events THIS client matched on the
   *   orphaned blocks, and its matches among the canonical blocks that
   *   displaced them (which no client saw)
   * - Handlers re-read absolute state at the tip, so one pass heals fork
   *   residue and applies the displaced blocks
   * - Drops the orphaned entries so a later reorg can't replay stale residue
   *
   * @param ctx - the block's shared sync context
   */
  private async heal(ctx: BlockContext): Promise<PoolMutation<T>[]> {
    const orphaned = ctx.orphaned.flatMap(
      (o) => this.applied.get(o.hash) ?? []
    );

    const canonical: DecodedEvent[] = [];
    for (const c of ctx.canonical) {
      const events = await ctx.eventsOf(c);
      canonical.push(...events.filter((e) => this.matches(e)));
    }

    const union = [...orphaned, ...canonical];
    const healed = await this.reread(union, ctx.block);

    this.log.debug('reorg', {
      at: ctx.block.number,
      depth: ctx.orphaned.length,
      canon: ctx.canonical.length,
      replayed: union.length,
      muts: healed.length,
      blocks: ctx.orphaned.map((b) => b.number).sort((a, b) => a - b),
    });

    for (const o of ctx.orphaned) this.applied.delete(o.hash);
    return healed;
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
      for (const x of this.effects) {
        if (x.match(e)) effectsRes.push(x.apply(e, block));
      }
    }
    await Promise.all(effectsRes);

    const handlersRes: Promise<PoolMutation<T>[]>[] = [];
    for (const e of events) {
      for (const h of this.handlers) {
        if (h.match(e)) handlersRes.push(h.resolve(e, block));
      }
    }
    return (await Promise.all(handlersRes)).flat();
  }

  /** Whether any handler or effect of this client matches the event */
  private matches(e: DecodedEvent): boolean {
    return (
      this.effects.some((x) => x.match(e)) ||
      this.handlers.some((h) => h.match(e))
    );
  }

  /**
   * Ring insert of the events this client matched at a block.
   *
   * - Bounded by `REORG_DEPTH`; oldest entry drops first
   */
  private remember(hash: string, touched: DecodedEvent[]): void {
    this.applied.set(hash, touched);
    if (this.applied.size > REORG_DEPTH) {
      const oldest = this.applied.keys().next().value;
      if (oldest !== undefined) this.applied.delete(oldest);
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
