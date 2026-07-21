import { distinctUntilChanged, MonoTypeOperatorFunction } from 'rxjs';

/**
 * Drop `watchEntries` emissions that carry no deltas — the query re-emits per
 * block whether or not the entries moved. The first emission always passes; it
 * seeds the initial state.
 *
 * `T` is left unconstrained so it infers from the pipe like rxjs' own
 * operators; constraining it to a `deltas` shape pins `T` to that constraint
 * and erases the caller's emission type.
 */
export function changedEntries<T>(): MonoTypeOperatorFunction<T> {
  return distinctUntilChanged((_, curr: any) => !curr?.deltas);
}
