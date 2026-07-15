import type { wsSource } from '@polkadot-api/forklift';

type Source = ReturnType<typeof wsSource>;

const REQUEST_TIMEOUT = 20_000;
const ATTEMPTS = 5;

/**
 * Make a forklift Source survive its upstream dropping.
 *
 * Building a block on a cold fork pulls the runtime's whole working set from
 * the remote node — hundreds of `archive_v1_storage` calls, one round-trip
 * each. Public endpoints routinely close the socket somewhere in the middle of
 * that. papi reconnects (and may fail over to another endpoint), but the
 * operation that was in flight when the socket died is simply lost: its promise
 * never settles. forklift then waits on it forever, the block never finishes,
 * and the whole run hangs on a chain that worked a minute ago.
 *
 * So give every storage read a deadline and retry it. The retry goes out on the
 * reconnected socket, and because forklift caches what it has already fetched
 * in the block's trie, each attempt picks up where the last one left off.
 */
export const resilient = (source: Source): Source => ({
  ...source,
  block: source.block,
  getStorage: (key) => withRetry(() => source.getStorage(key)),
  getStorageBatch: (keys) => withRetry(() => source.getStorageBatch(keys)),
  getStorageDescendants: (prefix) =>
    withRetry(() => source.getStorageDescendants(prefix)),
});

const withRetry = async <T>(fn: () => Promise<T>): Promise<T> => {
  let last: unknown;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      return await deadline(fn());
    } catch (e) {
      last = e;
    }
  }
  throw last;
};

const deadline = <T>(p: Promise<T>): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    p,
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('storage read timed out')),
        REQUEST_TIMEOUT
      );
    }),
  ]).finally(() => clearTimeout(timer)) as Promise<T>;
};
