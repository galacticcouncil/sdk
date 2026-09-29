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

/**
 * Coalesces single-key reads of one storage entry into one multi-key read.
 *
 * - Reads at one block issued in the same tick share a request
 * - Every caller gets its own key's value, or the shared request's error
 *
 * @param getValues - the entry's multi-key read
 */
export function batchValues<K extends unknown[], V>(
  getValues: (keys: K[], options: { at: string }) => Promise<V[]>
): (at: string, ...key: K) => Promise<V> {
  const batches = new Map<
    string,
    { key: K; resolve: (v: V) => void; reject: (e: unknown) => void }[]
  >();

  const flush = async (at: string) => {
    const batch = batches.get(at)!;
    batches.delete(at);
    try {
      const values = await getValues(
        batch.map(({ key }) => key),
        { at }
      );
      batch.forEach(({ resolve }, i) => resolve(values[i]));
    } catch (e) {
      batch.forEach(({ reject }) => reject(e));
    }
  };

  return (at, ...key) =>
    new Promise<V>((resolve, reject) => {
      const batch = batches.get(at);
      if (batch) {
        batch.push({ key, resolve, reject });
        return;
      }
      batches.set(at, [{ key, resolve, reject }]);
      setTimeout(() => flush(at), 0);
    });
}

/**
 * Reads a list in two parts, split by a predicate.
 *
 * - Both parts are read concurrently
 * - A reader is skipped when its part is empty
 *
 * @param list - items to read
 * @param inFirst - routes an item to `readFirst`, otherwise to `readRest`
 * @param readFirst - reads the matching items, in their order
 * @param readRest - reads the other items, in their order
 * @returns results in `list` order
 */
export async function readPartitioned<T, R>(
  list: T[],
  inFirst: (item: T) => boolean,
  readFirst: (part: T[]) => Promise<R[]>,
  readRest: (part: T[]) => Promise<R[]>
): Promise<R[]> {
  const routes = list.map(inFirst);
  const first = list.filter((_, i) => routes[i]);
  const rest = list.filter((_, i) => !routes[i]);

  const [firstResults, restResults] = await Promise.all([
    first.length ? readFirst(first) : [],
    rest.length ? readRest(rest) : [],
  ]);

  let f = 0;
  let r = 0;
  return routes.map((route) => (route ? firstResults[f++] : restResults[r++]));
}
