import { TLRUCache } from '@thi.ng/cache';

export class QueryBus {
  private readonly cache: TLRUCache<string, Promise<any>>;

  constructor(ttlMs = 6000) {
    this.cache = new TLRUCache<string, Promise<any>>(null, {
      ttl: ttlMs,
    });
  }

  scope<K, V>(
    name: string,
    fetch: (k: K) => Promise<V>,
    toKey: (k: K) => string
  ) {
    const live = new Map<string, V>();
    const scoped = (k: K) => `${name}|${toKey(k)}`;

    const get = (k: K): Promise<V> => {
      const mk = toKey(k);
      if (live.has(mk)) {
        const l = live.get(mk)!;
        return Promise.resolve(l);
      }

      const key = scoped(k);
      const hit = this.cache.get(key);
      if (hit) return hit as Promise<V>;

      const p = fetch(k);
      this.cache.set(key, p);
      return p;
    };

    const set = (k: K, v: V) => {
      live.set(toKey(k), v);
    };

    const clear = () => {
      live.clear();
    };

    return {
      get,
      set,
      clear,
    };
  }
}
