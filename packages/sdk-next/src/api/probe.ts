import { PolkadotClient } from 'polkadot-api';

import { Observable, defer, from, timer, of } from 'rxjs';

import {
  catchError,
  distinctUntilChanged,
  map,
  shareReplay,
  switchMap,
  timeout,
} from 'rxjs/operators';

type ConnState = 'online' | 'offline';

type Opts = { intervalMs?: number; rpcTimeoutMs?: number };

/**
 * Periodically probes the node and exposes a derived
 * online/offline state.
 *
 * @param client - polkadot client
 * @param opts.intervalMs - probe interval
 * @param opts.rpcTimeoutMs - rpc timeout
 *
 * @returns observable emitting connection state
 */
export function connectionProbe$(
  client: PolkadotClient,
  { intervalMs = 5_000, rpcTimeoutMs = 1_500 }: Opts = {}
): Observable<ConnState> {
  return timer(0, intervalMs).pipe(
    switchMap(() =>
      defer(() => from(client._request('system_health', [] as any))).pipe(
        timeout({ first: rpcTimeoutMs }),
        map((): ConnState => 'online'),
        catchError(() => of<ConnState>('offline'))
      )
    ),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );
}
