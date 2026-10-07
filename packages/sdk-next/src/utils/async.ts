/**
 * Deadline for one chain read.
 *
 * - A dropped chainHead operation never rejects, so an unguarded read wedges
 *   its caller for good; the deadline turns that silence into a named error
 */
export const READ_TIMEOUT = 15_000;

export function withTimeout<T>(
  p: Promise<T>,
  ms: number,
  label = 'timeout'
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(label)), ms);
    p.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      }
    );
  });
}

/**
 * A keyed promise cache with request coalescing.
 *
 * - Concurrent callers share one in-flight load
 * - A rejected load is dropped, so the next call retries
 *
 * @param cache - promises by key
 * @param key - cache key
 * @param load - produces the value when the key is absent
 */
export function memo<K, V>(
  cache: Map<K, Promise<V>>,
  key: K,
  load: () => Promise<V>
): Promise<V> {
  let entry = cache.get(key);
  if (!entry) {
    entry = load().catch((e) => {
      cache.delete(key);
      throw e;
    });
    cache.set(key, entry);
  }
  return entry;
}
