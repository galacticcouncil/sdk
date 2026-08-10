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
export interface QueryTally {
  live: number;
  memo: number;
  fetch: number;
  unpinned: number;
}

/**
 * Keyed cache for auxiliary query results (fees, oracles, pegs).
 *
 * - `live`: values set from events; authoritative, read-your-writes, persistent
 * - `cache`: on-demand fetches at a block, request-coalesced (shared promise)
 * - `get` prefers live, then cache, then fetches at `at`
 * - A read at a TAG is never memoized: the key would never change while the
 *   block under it does, pinning the first value read for good
 */
export class QueryCache {
  private debug: boolean;

  /** Every scope's `clear`, so the whole cache can be dropped at once */
  private scopes: (() => void)[] = [];

  constructor(debug?: boolean) {
    this.debug = debug || false;
  }

  private counters: QueryTally = { live: 0, memo: 0, fetch: 0, unpinned: 0 };

  /** Reads served per tier since this cache was created */
  get tally(): Readonly<QueryTally> {
    return this.counters;
  }

  private log(op: string, scope: string, key?: string) {
    this.debug && console.log(op, scope, key);
  }

  /** Count a read and, when debugging, name what served it */
  private served(tier: keyof QueryTally, scope: string, key?: string) {
    this.counters[tier]++;
    this.log(`[${tier}]`, scope, key);
  }

  /**
   * Drop every scope's live and cached values.
   *
   * - For a reseed: the whole state is re-derived at one block, so nothing an
   *   earlier event wrote may survive into it
   */
  clear() {
    for (const clear of this.scopes) clear();
  }

  /**
   * Create a keyed scope over one query.
   *
   * @param name - scope label (logs)
   * @param fetch - reads the value at a given block `at`
   * @param toKey - stable cache key from the args (never includes `at`)
   * @param invalidation - fetch-tier freshness policy (default `'persistent'`)
   */
  scope<K extends any[], V>(
    name: string,
    fetch: (at: string, ...args: K) => Promise<V>,
    toKey: (...args: K) => string,
    invalidation: QueryInvalidation = 'persistent'
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

    /** The fetch tier => memoized per the scope's policy */
    const fetchAt = (at: string, ...args: K): Promise<V> => {
      const key = toKey(...args);

      // A tag moves under a fixed key, read through, never memoize.
      if (!isPinned(at)) {
        this.served('unpinned', name, key);
        return read(at, ...args);
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
      const p = read(at, ...args).catch((err) => {
        cache.delete(key);
        throw err;
      });

      cache.set(key, p);
      return p;
    };

    /** Get a value from live if an event wrote one, otherwise read at `at` */
    const get = (at: string, ...args: K): Promise<V> => {
      const key = toKey(...args);

      if (live.has(key)) {
        this.served('live', name, key);
        return Promise.resolve(live.get(key)!);
      }

      return fetchAt(at, ...args);
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
      const value = await (memoized ? fetchAt(at, ...args) : read(at, ...args));
      set(value, ...args);
      return value;
    };

    /** Forget everything this scope knows */
    const clear = () => {
      this.log('[clear]', name);
      live.clear();
      cache.release();
    };

    this.scopes.push(clear);

    return {
      get,
      set,
      refresh,
      clear,
    };
  }
}
