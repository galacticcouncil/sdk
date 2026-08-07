import { PolkadotClient } from 'polkadot-api';

import {
  EMPTY,
  Observable,
  OperatorFunction,
  Subscription,
  interval,
  merge,
} from 'rxjs';

import {
  catchError,
  concatMap,
  filter,
  pairwise,
  repeat,
  tap,
} from 'rxjs/operators';

import { BlockAt, Papi } from '../api';

import { PoolLog } from './PoolLog';
import {
  BlockContext,
  BlockRef,
  ChainTracker,
  DecodedEvent,
  EventBus,
} from './events';

import type { PoolClient } from './PoolClient';

const GAP_THRESHOLD = 3;
const REPEAT_DELAY = 1_000;
const RESEED_INTERVAL = 60 * 60 * 1_000; // 60 min
const RESTART_THROTTLE = 3_000;

/**
 * The single per-block driver for every registered pool client.
 *
 * - Owns the block subscription, the chain lineage and the watchdog; the work
 *   that is identical for every client is done once
 * - Per block it classifies lineage, reads any referenced block's events once,
 *   then hands the context to each client's OWN queue without awaiting it
 * - Clients stay independent: only a declared dependency waits, and only on
 *   its sources' commit of that same block
 */
export class PoolSync extends Papi {
  private static instance?: PoolSync;

  private readonly log = new PoolLog('SYNC');
  private readonly eventBus: EventBus;

  /** Registered clients, topologically ordered (sources before dependents) */
  private clients: PoolClient<any>[] = [];
  private refs = new Map<PoolClient<any>, number>();

  private chain?: ChainTracker;
  private session?: Subscription;
  private restartAt = 0;

  private constructor(client: PolkadotClient, at: BlockAt) {
    super(client, at);
    /**
     * A historical `at` is a pinned snapshot, never watched — such a client
     * only reaches the driver if subscribed directly, so follow best.
     */
    this.eventBus = new EventBus(
      this.api,
      at === 'finalized' ? 'finalized' : 'best'
    );
  }

  /**
   * The driver, following the `at` of whoever created it first.
   *
   * @param client - polkadot client
   * @param at - feed the registering client was created with
   */
  static shared(client: PolkadotClient, at: BlockAt = 'best'): PoolSync {
    if (!PoolSync.instance) {
      PoolSync.instance = new PoolSync(client, at);
    }
    return PoolSync.instance;
  }

  /**
   * Register a client for driving; its sources register first.
   *
   * - The client reseeds on the next delivered block
   * - Starts the session when idle; unsubscribing releases the client
   *   (and the sources it pulled in)
   *
   * @param client - the client to drive
   */
  register(client: PoolClient<any>): Subscription {
    const sub = new Subscription();
    for (const dep of client.dependencies()) {
      sub.add(this.register(dep));
    }

    const refs = (this.refs.get(client) ?? 0) + 1;
    this.refs.set(client, refs);

    if (refs === 1) {
      this.clients.push(client);
      this.order();
      client.syncReset();
      this.log.debug('register', {
        pool: client.getPoolType(),
        deps: client.dependencies().map((dep) => dep.getPoolType()),
      });
    }

    if (!this.session) this.start();

    sub.add(() => this.release(client));
    return sub;
  }

  /**
   * Drop a client's state; it reseeds on the next delivered block.
   *
   * @param client - the client to reseed
   */
  reseed(client: PoolClient<any>): void {
    this.log.debug('reseed', { pool: client.getPoolType() });
    client.syncReset();
  }

  private release(client: PoolClient<any>): void {
    const refs = (this.refs.get(client) ?? 1) - 1;
    if (refs > 0) {
      this.refs.set(client, refs);
      return;
    }

    this.refs.delete(client);
    this.clients = this.clients.filter((c) => c !== client);
    this.log.debug('release', {
      pool: client.getPoolType(),
      driven: this.clients.map((c) => c.getPoolType()),
    });

    if (this.clients.length === 0) this.stop();
  }

  private start(): void {
    this.log.debug('start', { at: this.at });
    this.chain = new ChainTracker(this.client);
    const session = new Subscription();
    session.add(this.subscribeBlocks());
    session.add(this.startWatchdog());
    this.session = session;
  }

  private stop(): void {
    this.session?.unsubscribe();
    this.session = undefined;
    this.chain = undefined;
  }

  /**
   * Order clients so every source precedes its dependents.
   *
   * - A dependency cycle is a wiring error and throws
   */
  private order(): void {
    const sorted: PoolClient<any>[] = [];
    const done = new Set<PoolClient<any>>();
    const path = new Set<PoolClient<any>>();

    const visit = (client: PoolClient<any>) => {
      if (done.has(client)) return;
      if (path.has(client)) {
        throw new Error(`sync dependency cycle at ${client.getPoolType()}`);
      }
      path.add(client);
      for (const dep of client.dependencies()) {
        if (this.refs.has(dep)) visit(dep);
      }
      path.delete(client);
      done.add(client);
      sorted.push(client);
    };

    for (const client of this.clients) visit(client);
    this.clients = sorted;
  }

  /**
   * One pass per delivered block: lineage, shared reads, dispatch.
   *
   * - The serial section is lineage only, so the next block is classified
   *   without waiting for any client's resolve
   */
  private subscribeBlocks(): Subscription {
    return this.eventBus
      .watchBlockEvents()
      .pipe(
        concatMap(async ({ block, events }) => {
          const chain = this.chain;
          if (!chain) return;

          /**
           * One events read per referenced block, shared by every client.
           */
          const cache = new Map<string, Promise<DecodedEvent[]>>();
          const eventsOf = (ref: BlockRef) => {
            let pending = cache.get(ref.hash);
            if (!pending) {
              pending = this.eventBus.eventsAt(ref.hash);
              cache.set(ref.hash, pending);
            }
            return pending;
          };

          /**
           * The first delivery pins the cursor; clients seed pinned at it.
           */
          if (!chain.seeded) {
            chain.apply(block);
            this.dispatch({
              block,
              events,
              missed: [],
              reorg: false,
              orphaned: [],
              canonical: [],
              eventsOf,
            });
            return;
          }

          const { missed, reorg } = await chain.classify(block);
          const { orphaned, canonical } = reorg
            ? await chain.split(block)
            : { orphaned: [], canonical: [] };

          /**
           * Lineage advances on delivery, independent of client progress —
           * `classify` compares against the last block DELIVERED.
           */
          for (const m of missed) chain.remember(m);
          if (reorg) chain.repair(orphaned, canonical);
          chain.apply(block);

          this.dispatch({
            block,
            events,
            missed,
            reorg,
            orphaned,
            canonical,
            eventsOf,
          });
        }),
        this.guard('blocks')
      )
      .subscribe();
  }

  /**
   * Hand the block to every client's own queue; NOT awaited.
   *
   * - Clients are ordered sources-first, so a dependent receives its sources'
   *   completion promises for THIS block
   *
   * @param ctx - the block's shared sync context
   */
  private dispatch(ctx: BlockContext): void {
    const done = new Map<PoolClient<any>, Promise<void>>();

    for (const client of this.clients) {
      const deps = client
        .dependencies()
        .map((dep) => done.get(dep))
        .filter((p): p is Promise<void> => p !== undefined);

      done.set(client, client.syncBlock(ctx, deps));
    }
  }

  /**
   * Starts the connection and block watchdog.
   *
   * - Reseeds every client on offline → online recovery
   * - Reseeds on a finalized block gap (monotonic, so reorgs never trip it)
   * - Reseeds periodically
   * - Errors are swallowed and the watchdog re-subscribes (`repeat`)
   */
  private startWatchdog(): Subscription {
    const recovery$ = this.watcher.connection$.pipe(
      pairwise(),
      filter(([prev, curr]) => prev === 'offline' && curr === 'online'),
      tap(() => this.reseedAll('recovery')),
      catchError((e) => {
        this.log.error('watchdog_recovery_error', e);
        return EMPTY;
      }),
      repeat({ delay: REPEAT_DELAY })
    );

    const gap$ = this.watcher.finalizedBlock$.pipe(
      pairwise(),
      tap(([prev, curr]) => {
        const from = Number(prev.number);
        const to = Number(curr.number);
        if (to - from >= GAP_THRESHOLD) {
          this.log.debug('watchdog_gap', { from, to });
          this.reseedAll('gap');
        }
      }),
      catchError((e) => {
        this.log.error('watchdog_gap_error', e);
        return EMPTY;
      }),
      repeat({ delay: REPEAT_DELAY })
    );

    const periodic$ = interval(RESEED_INTERVAL).pipe(
      tap(() => this.reseedAll('periodic')),
      catchError((e) => {
        this.log.error('watchdog_periodic_error', e);
        return EMPTY;
      }),
      repeat({ delay: REPEAT_DELAY })
    );

    return merge(recovery$, gap$, periodic$).subscribe();
  }

  private reseedAll(reason: string): void {
    this.log.debug('reseed_all', { reason, clients: this.clients.length });
    for (const client of this.clients) client.syncReset();
  }

  /**
   * Guards the block stream.
   *
   * - Logs any error and treats it as fatal
   * - Rebuilds the session
   *
   * @param tag - log prefix of the stream
   */
  private guard<X>(tag: string): OperatorFunction<X, X> {
    return (source: Observable<X>) =>
      source.pipe(
        tap({
          error: (e) => {
            this.log.error(tag, e);
            this.restart();
          },
        }),
        catchError(() => EMPTY)
      );
  }

  /**
   * Rebuilds the session on the next tick.
   *
   * - Fresh lineage, every client reseeds
   * - Rate-limited to avoid restart storms
   */
  private restart(): void {
    const now = Date.now();
    if (now - this.restartAt < RESTART_THROTTLE) return;
    this.restartAt = now;

    setTimeout(() => {
      if (this.clients.length === 0) return;
      this.log.debug('restart', { clients: this.clients.length });
      this.session?.unsubscribe();
      this.session = undefined;
      this.reseedAll('restart');
      this.start();
    }, 0);
  }
}
