import {
  concat,
  connect,
  debounceTime,
  take,
  MonoTypeOperatorFunction,
} from 'rxjs';

/**
 * Emit the first value immediately, debounce every value after it.
 *
 * A plain `debounceTime` delays the first value by the full window, which is
 * pure latency — the window is only useful for coalescing the burst of updates
 * that follows. Note the second stream deliberately has no `skip(1)`: the
 * multicast subject does not replay, so it never sees the first value and a
 * skip would swallow the second one instead.
 */
export function debounceAfterFirst<T>(ms: number): MonoTypeOperatorFunction<T> {
  return connect((shared) =>
    concat(shared.pipe(take(1)), shared.pipe(debounceTime(ms)))
  );
}
