import { TLRUCache } from '@thi.ng/cache';

import { withTimeout } from './async';

/**
 * Deadline for one read.
 *
 * - A dropped chainHead operation never rejects, so an unguarded read wedges its
 *   caller for good; this turns that silence into a named error
 */
const QUERY_TIMEOUT = 15_000;

/**
 * Freshness policy for a scope's on-demand fetch tier.
 *
 * - `'block'`: valid for one block; dropped when the read `at` changes
 * - `'persistent'`: kept until `clear()` (event-authoritative config)
 * - `number`: TTL in ms (for expensive reads, e.g. EVM)
 */
export type QueryInvalidation = 'block' | 'persistent' | number;

/**
 * Only a block hash pins a read; `best`/`finalized` name a moving target.
 */
const isPinned = (at: string) => at.startsWith('0x');

/**
 * Reads by what served them.
 *
 * - `live` / `memo` cost nothing; `fetch` / `unpinned` hit the chain
 */
export type QueryTier = 'live' | 'memo' | 'fetch' | 'unpinned';

export interface QueryTally extends Record<QueryTier, number> {
  /** Chain reads per scope, so the heaviest query is visible */
  scopes: Record<string, number>;
}

/**
 * Keyed cache for auxiliary query results (fees, oracles, pegs).
 *
 * - `live`: values set from events; authoritative, read-your-writes, persistent
 * - `cache`: on-demand fetches at a block, request-coalesced (shared promise)
 * - `get` prefers live, then cache, then fetches at `at`
 * - `getMany` resolves each key the same way; misses share one batched read
 * - A read at a TAG is never memoized: the key would never change while the
 *   block under it does, pinning the first value read for good
 */
export class QueryCache {
  private debug: boolean;

  /** Every scope's `clear`, so the whole cache can be dropped at once */
  private clears: (() => void)[] = [];

  private counters: QueryTally = {
    live: 0,
    memo: 0,
    fetch: 0,
    unpinned: 0,
    scopes: {},
  };

  constructor(debug?: boolean) {
    this.debug = debug || false;
  }

  /** Reads served per tier since this cache was created */
  get tally(): Readonly<QueryTally> {
    return this.counters;
  }

  private log(op: string, scope: string, key?: string) {
    this.debug && console.log(op, scope, key);
  }

  /**
   * Count a read and, when debugging, name what served it.
   *
   * - Only the tiers that reached the chain are attributed to their scope
   */
  private served(tier: QueryTier, scope: string, key?: string) {
    this.counters[tier]++;
    if (tier === 'fetch' || tier === 'unpinned') {
      this.counters.scopes[scope] = (this.counters.scopes[scope] ?? 0) + 1;
    }
    this.log(`[${tier}]`, scope, key);
  }

  /**
   * Drop every scope's live and cached values.
   *
   * - For a reseed: the whole state is re-derived at one block, so nothing an
   *   earlier event wrote may survive into it
   */
  clear() {
    for (const clear of this.clears) clear();
  }

  /**
   * Create a keyed scope over one query.
   *
   * @param name - scope label (logs)
   * @param fetch - reads the value at a given block `at`
   * @param toKey - stable cache key from the args (never includes `at`)
   * @param invalidation - fetch-tier freshness policy (default `'persistent'`)
   * @param fetchMany - reads many values at `at` in one go, in input order
   */
  scope<K extends any[], V>(
    name: string,
    fetch: (at: string, ...args: K) => Promise<V>,
    toKey: (...args: K) => string,
    invalidation: QueryInvalidation = 'persistent',
    fetchMany?: (at: string, args: K[]) => Promise<V[]>
  ) {
    const live = new Map<string, V>();
    const cache =
      typeof invalidation === 'number'
        ? new TLRUCache<string, Promise<V>>(null, { ttl: invalidation })
        : new TLRUCache<string, Promise<V>>();

    let gen: string | undefined;

    /** Names the scope, key and block, so a stalled read self-identifies */
    const read = (at: string, ...args: K): Promise<V> =>
      withTimeout(
        fetch(at, ...args),
        QUERY_TIMEOUT,
        `${name}[${toKey(...args)}] stalled at ${at}`
      );

    /** Many values in one read; one `fetch` per key without `fetchMany` */
    const readMany = (at: string, list: K[]): Promise<V[]> =>
      withTimeout(
        fetchMany
          ? fetchMany(at, list)
          : Promise.all(list.map((args) => fetch(at, ...args))),
        QUERY_TIMEOUT,
        `${name}[${list.length} keys] stalled at ${at}`
      );

    /**
     * The fetch tier => memoized per the scope's policy.
     *
     * @param load - reads the value on a miss (default: `fetch` at `at`)
     */
    const fetchAt = (
      at: string,
      args: K,
      load = () => read(at, ...args)
    ): Promise<V> => {
      const key = toKey(...args);

      // A tag moves under a fixed key, read through, never memoize.
      if (!isPinned(at)) {
        this.served('unpinned', name, key);
        return load();
      }

      // Drop last block's fetches when the read moves to a new block.
      if (invalidation === 'block' && at !== gen) {
        gen = at;
        cache.release();
      }

      if (cache.has(key)) {
        this.served('memo', name, key);
        return cache.get(key)!;
      }

      this.served('fetch', name, key);
      const p = load().catch((err) => {
        cache.delete(key);
        throw err;
      });

      cache.set(key, p);
      return p;
    };

    /** A value from live if an event wrote one, otherwise the fetch tier */
    const resolve = (
      at: string,
      args: K,
      load?: () => Promise<V>
    ): Promise<V> => {
      const key = toKey(...args);

      if (live.has(key)) {
        this.served('live', name, key);
        return Promise.resolve(live.get(key)!);
      }

      return fetchAt(at, args, load);
    };

    /** Get a value from live if an event wrote one, otherwise read at `at` */
    const get = (at: string, ...args: K): Promise<V> => resolve(at, args);

    /**
     * Get many values; what no tier holds is read in one batch.
     *
     * - Each key resolves like `get`: live, then memo, then the chain
     * - Misses share one `fetchMany` read, memoized per key like a fetch
     */
    const getMany = (at: string, list: K[]): Promise<V[]> => {
      const misses: K[] = [];
      let readMisses!: (values: Promise<V[]>) => void;
      const batch = new Promise<V[]>((r) => (readMisses = r));

      const values = list.map((args) =>
        resolve(at, args, () => {
          const i = misses.push(args) - 1;
          return batch.then((vs) => vs[i]);
        })
      );

      readMisses(misses.length ? readMany(at, misses) : Promise.resolve([]));
      return Promise.all(values);
    };

    /** Promote a value an event already carries to live, no read */
    const set = (v: V, ...args: K) => {
      const key = toKey(...args);
      this.log('[set-live]', name, key);
      live.set(key, v);
    };

    /**
     * Read at `at` and promote to live.
     *
     * - Live shadows `get`, so an event that says the value moved needs this
     * - A block-scoped memo of the same block is reused: state under a hash is
     *   immutable, so it is as fresh as a new read
     * - Any other tier reads through; its entry carries no block identity
     */
    const refresh = async (at: string, ...args: K): Promise<V> => {
      const memoized = invalidation === 'block' && isPinned(at);
      const value = await (memoized ? fetchAt(at, args) : read(at, ...args));
      set(value, ...args);
      return value;
    };

    /** Forget everything this scope knows */
    const clear = () => {
      this.log('[clear]', name);
      live.clear();
      cache.release();
    };

    this.clears.push(clear);

    return {
      get,
      getMany,
      set,
      refresh,
      clear,
    };
  }
}
