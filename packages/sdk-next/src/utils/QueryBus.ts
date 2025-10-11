import { TLRUCache } from '@thi.ng/cache';

export class QueryBus {
  private debug: boolean;

  constructor(debug?: boolean) {
    this.debug = debug || false;
  }

  private log(op: string, scope: string, key?: string) {
    this.debug && console.log(op, scope, key);
  }

  scope<K, V>(
    name: string,
    fetch: (k: K) => Promise<V>,
    toKey: (k: K) => string,
    ttlMs?: number
  ) {
    const live = new Map<string, V>();
    const cache =
      ttlMs !== undefined
        ? new TLRUCache<string, Promise<V>>(null, { ttl: ttlMs })
        : new TLRUCache<string, Promise<V>>();

    const get = (k: K): Promise<V> => {
      const key = toKey(k);
      if (live.has(key)) {
        this.log('[live]', name, key);
        const hit = live.get(key)!;
        return Promise.resolve(hit);
      }

      if (cache.has(key)) {
        this.log('[memo]', name, key);
        return cache.get(key)!;
      }

      this.log('[fetch]', name, key);
      const p = fetch(k).catch((err) => {
        cache.delete(key);
        throw err;
      });

      cache.set(key, p);
      return p;
    };

    const set = (k: K, v: V) => {
      const key = toKey(k);
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
