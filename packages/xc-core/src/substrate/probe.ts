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

export type ProbeState = 'healthy' | 'stale';

export type ProbeConfig = {
  intervalMs?: number;
  timeoutMs?: number;
  staleThreshold?: number;
};

type ProbeResult = {
  state: ProbeState;
  delayMs: number;
  blockNumber?: number;
  staleCount: number;
};

export function blockProbe$(
  client: PolkadotClient,
  {
    intervalMs = 5_000,
    timeoutMs = 5_000,
    staleThreshold = 3,
  }: ProbeConfig = {}
): Observable<ProbeState> {
  const probeOnce$ = (prev: ProbeResult) =>
    defer(() =>
      from(client._request<{ number: string }>('chain_getHeader', []))
    ).pipe(
      timeout({ first: timeoutMs }),
      map((header): ProbeResult => {
        const blockNumber = parseInt(header.number, 16);
        const isStale =
          prev.blockNumber !== undefined && blockNumber <= prev.blockNumber;
        const staleCount = isStale ? prev.staleCount + 1 : 0;
        const state: ProbeState =
          staleCount >= staleThreshold ? 'stale' : 'healthy';
        return { state, blockNumber, staleCount, delayMs: intervalMs };
      }),
      catchError(() =>
        of<ProbeResult>({
          state: 'stale',
          staleCount: 0,
          delayMs: intervalMs,
        })
      )
    );

  const initial: ProbeResult = {
    state: 'healthy',
    staleCount: 0,
    delayMs: 0,
  };

  return of(initial).pipe(
    expand((prev) =>
      timer(prev.delayMs).pipe(switchMap(() => probeOnce$(prev)))
    ),
    skip(1),
    map((r) => r.state),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );
}
