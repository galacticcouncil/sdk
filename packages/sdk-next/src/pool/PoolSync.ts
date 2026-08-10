import { PolkadotClient } from 'polkadot-api';

import {
  EMPTY,
  Observable,
  OperatorFunction,
  Subscription,
  interval,
  merge,
  filter,
} from 'rxjs';

import {
  catchError,
  concatMap,
  map,
  pairwise,
  repeat,
  tap,
} from 'rxjs/operators';

import { BlockRef, Papi } from '../api';

import { PoolLog } from './PoolLog';
import { BlockContext, DecodedEvent, EventBus } from './events';

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

  private session?: Subscription;
  private restartAt = 0;

  private constructor(client: PolkadotClient) {
    super(client, 'best');
    this.eventBus = new EventBus(client);
  }

  /**
   * The driver, shared by every client it drives.
   *
   * - Always follows the best chain: it is the only feed a live pool can track,
   *   so there is no per-client target to reconcile
   *
   * @param client - polkadot client
   */
  static shared(client: PolkadotClient): PoolSync {
    if (!PoolSync.instance) {
      PoolSync.instance = new PoolSync(client);
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
      this.log.debug('sync_register', {
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
    this.log.debug('sync_reseed', { pool: client.getPoolType() });
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
    this.log.debug('sync_release', {
      pool: client.getPoolType(),
      driven: this.clients.map((c) => c.getPoolType()),
    });

    if (this.clients.length === 0) this.stop();
  }

  private start(): void {
    this.log.debug('sync_start', { at: this.at });
    const session = new Subscription();
    session.add(this.subscribeBlocks());
    session.add(this.startWatchdog());
    this.session = session;
  }

  private stop(): void {
    this.session?.unsubscribe();
    this.session = undefined;
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
   * One pass per feed update: read the tip's events, then dispatch.
   *
   * - The feed already diffed itself, so the serial section is one events read
   *   and no lineage RPC at all
   * - Dispatch is not awaited, so the next update is handled without waiting
   *   for any client's resolve
   */
  private subscribeBlocks(): Subscription {
    return this.eventBus
      .watchChain()
      .pipe(
        concatMap(async ({ applied, orphaned, gap }) => {
          /**
           * Lagged past the feed's window — the blocks in between are gone, so
           * no replay can reconstruct them.
           */
          if (gap) {
            this.log.debug('chain_gap', {
              at: applied[applied.length - 1].number,
              from: applied[0].number,
            });
            this.reseedAll('gap');
          }

          const block = applied[applied.length - 1];
          const below = applied.slice(0, -1);

          if (orphaned.length > 0) {
            this.log.debug('chain_reorg', {
              at: block.number,
              depth: orphaned.length,
              replaced: below.length,
              blocks: orphaned.map((b) => b.number),
            });
          } else if (below.length > 0) {
            this.log.debug('chain_backfill', {
              at: block.number,
              blocks: below.map((b) => b.number),
            });
          }

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

          this.dispatch({
            block,
            events: await eventsOf(block),
            below,
            orphaned,
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
   * Starts the block watchdog.
   *
   * - Reseeds when a dropped connection comes back
   * - Reseeds on a finalized block gap (monotonic, so reorgs never trip it)
   * - Reseeds periodically
   * - Errors are swallowed and the watchdog re-subscribes (`repeat`)
   */
  private startWatchdog(): Subscription {
    const recovery$ = this.watcher.connection$.pipe(
      map((state) => ({ state, at: Date.now() })),
      pairwise(),
      filter(
        ([prev, curr]) => prev.state === 'offline' && curr.state === 'online'
      ),
      tap(([prev, curr]) => this.reseedAll('recovery', curr.at - prev.at)),
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

  private reseedAll(reason: string, downMs?: number): void {
    this.log.debug('sync_reseed_all', {
      reason,
      clients: this.clients.length,
      ...(downMs !== undefined && { downMs }),
    });
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
      this.log.debug('sync_restart', { clients: this.clients.length });
      this.session?.unsubscribe();
      this.session = undefined;
      this.reseedAll('restart');
      this.start();
    }, 0);
  }
}
