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
