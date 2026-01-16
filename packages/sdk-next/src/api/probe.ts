import { PolkadotClient } from 'polkadot-api';

import { Observable, defer, from, of, timer } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  expand,
  map,
  shareReplay,
  skip,
  switchMap,
  timeout,
} from 'rxjs/operators';

type ConnState = 'online' | 'offline';

type Opts = {
  intervalMs?: number;
  rpcTimeoutMs?: number;
};

type Probe = {
  state: ConnState;
  delayMs: number;
};

/**
 * Periodically probes the node and exposes a derived
 * online/offline state.
 *
 * Behavior:
 * - Runs one probe at a time
 * - Each probe is allowed to run up to `rpcTimeoutMs`
 * - Next probe is scheduled after the previous one completes plus `intervalMs`
 * - Does not emit an initial synthetic state
 * - Emits only on state changes
 *
 * @param client - polkadot client
 * @param opts.intervalMs - time between probes
 * @param opts.rpcTimeoutMs - time to wait before emitting offline
 *
 * @returns observable emitting connection state
 */
export function connectionProbe$(
  client: PolkadotClient,
  { intervalMs = 5_000, rpcTimeoutMs = 15_000 }: Opts = {}
): Observable<ConnState> {
  const probeOnce$ = () =>
    defer(() => from(client._request('system_health', [] as unknown[]))).pipe(
      timeout({ first: rpcTimeoutMs }),
      map((): ConnState => 'online'),
      catchError(() => of<ConnState>('offline'))
    );

  const initial: Probe = { state: 'offline', delayMs: 0 };

  return of(initial).pipe(
    expand((p) =>
      timer(p.delayMs).pipe(
        switchMap(probeOnce$),
        map((state): Probe => ({ state, delayMs: intervalMs }))
      )
    ),
    skip(1),
    map((p) => p.state),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );
}
