import { TLRUCache } from '@thi.ng/cache';

/**
 * Freshness policy for a scope's on-demand fetch tier.
 *
 * - `'block'`: valid for one block; dropped when the read `at` changes
 * - `'persistent'`: kept until `clear()` (event-authoritative config)
 * - `number`: TTL in ms (for expensive reads, e.g. EVM)
 */
export type QueryInvalidation = 'block' | 'persistent' | number;

/**
 * Keyed cache for auxiliary query results (fees, oracles, pegs).
 *
 * - `live`: values set from events; authoritative, read-your-writes, persistent
 * - `cache`: on-demand fetches at a block, request-coalesced (shared promise)
 * - `get` prefers live, then cache, then fetches at `at`
 */
export class QueryCache {
  private debug: boolean;

  constructor(debug?: boolean) {
    this.debug = debug || false;
  }

  private log(op: string, scope: string, key?: string) {
    this.debug && console.log(op, scope, key);
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

    const get = (at: string, ...args: K): Promise<V> => {
      const key = toKey(...args);

      if (live.has(key)) {
        this.log('[live]', name, key);
        return Promise.resolve(live.get(key)!);
      }

      // Drop last block's fetches when the read moves to a new block.
      if (invalidation === 'block' && at !== gen) {
        gen = at;
        cache.release();
      }

      if (cache.has(key)) {
        this.log('[memo]', name, key);
        return cache.get(key)!;
      }

      this.log('[fetch]', name, key);
      const p = fetch(at, ...args).catch((err) => {
        cache.delete(key);
        throw err;
      });

      cache.set(key, p);
      return p;
    };

    const set = (v: V, ...args: K) => {
      const key = toKey(...args);
      this.log('[set-live]', name, key);
      live.set(key, v);
    };

    const clear = () => {
      this.log('[clear]', name);
      live.clear();
      cache.release();
    };

    return {
      get,
      set,
      clear,
    };
  }
}
