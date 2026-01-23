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
};

export type BlockProbeConfig = ProbeConfig & {
  staleThreshold?: number;
};

type ProbeResult = {
  state: ProbeState;
  delayMs: number;
};

type BlockProbeResult = ProbeResult & {
  blockNumber?: number;
  staleCount: number;
};

export function connectionProbe$(
  client: PolkadotClient,
  { intervalMs = 5000, timeoutMs = 15000 }: ProbeConfig = {}
): Observable<ProbeState> {
  const probeOnce$ = () =>
    defer(() => from(client._request('system_health', []))).pipe(
      timeout({ first: timeoutMs }),
      map((): ProbeResult => ({ state: 'healthy', delayMs: intervalMs })),
      catchError(() => of<ProbeResult>({ state: 'stale', delayMs: intervalMs }))
    );

  const initial: ProbeResult = { state: 'stale', delayMs: 0 };

  return of(initial).pipe(
    expand((prev) => timer(prev.delayMs).pipe(switchMap(() => probeOnce$()))),
    skip(1),
    map((r) => r.state),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );
}

export function blockProbe$(
  client: PolkadotClient,
  {
    intervalMs = 2000,
    timeoutMs = 6000,
    staleThreshold = 3,
  }: BlockProbeConfig = {}
): Observable<ProbeState> {
  const probeOnce$ = (prev: BlockProbeResult) =>
    defer(() =>
      from(client._request<{ number: string }>('chain_getHeader', []))
    ).pipe(
      timeout({ first: timeoutMs }),
      map((header): BlockProbeResult => {
        const blockNumber = parseInt(header.number, 16);
        const isStale =
          prev.blockNumber !== undefined && blockNumber <= prev.blockNumber;
        const staleCount = isStale ? prev.staleCount + 1 : 0;
        const state: ProbeState =
          staleCount >= staleThreshold ? 'stale' : 'healthy';
        return { state, blockNumber, staleCount, delayMs: intervalMs };
      }),
      catchError(() =>
        of<BlockProbeResult>({
          state: 'stale',
          staleCount: 0,
          delayMs: intervalMs,
        })
      )
    );

  const initial: BlockProbeResult = {
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
