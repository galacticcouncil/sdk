/**
 * The value cached under `key`, loaded on first use.
 *
 * - A failed load is dropped, so the next call retries
 *
 * @param cache - pending or settled loads, by key
 * @param key - what the value is cached under
 * @param load - loads the value
 */
export function memoize<K, V>(
  cache: Map<K, Promise<V>>,
  key: K,
  load: () => Promise<V>
): Promise<V> {
  let value = cache.get(key);
  if (!value) {
    const pending = load();
    pending.catch(() => {
      if (cache.get(key) === pending) cache.delete(key);
    });
    cache.set(key, pending);
    value = pending;
  }
  return value;
}
