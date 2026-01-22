import { XcJourney, XcJourneyReplaceEvt, XcJourneyRequest } from './types';

export class OcelloidsSseClient {
  private _baseUrl: string;

  public constructor(baseUrl: string) {
    this._baseUrl = baseUrl;
  }

  subscribe(
    request: XcJourneyRequest,
    opts: {
      onNewJourney(journey: XcJourney, req: XcJourneyRequest): void;
      onUpdateJourney(journey: XcJourney, req: XcJourneyRequest): void;
      onReplaceJourney(
        journey: XcJourneyReplaceEvt,
        req: XcJourneyRequest
      ): void;
      onOpen(): void;
      onError(error: any): void;
    }
  ): () => void {
    const url = `${this._baseUrl}/sse/crosschain/default`;

    const criteria = Object.entries(request.criteria || {}).map(
      ([key, value]) => [key, String(value)]
    );

    const urlParams = new URLSearchParams(criteria).toString();

    let es: EventSource | null = null;
    let stopped = false;

    const connect = () => {
      if (stopped) return;

      es = new EventSource(`${url}?${urlParams}`);

      es.onopen = opts.onOpen;

      es.addEventListener('update_journey', (e) =>
        opts.onUpdateJourney(JSON.parse(e.data), request)
      );

      es.addEventListener('new_journey', (e) =>
        opts.onNewJourney(JSON.parse(e.data), request)
      );

      es.addEventListener('replace_journey', (e) =>
        opts.onReplaceJourney(JSON.parse(e.data), request)
      );

      es.onerror = (error) => {
        opts.onError(error);

        if (es && es.readyState === EventSource.CLOSED) {
          console.log('SSE closed, reconnecting in 5s...');
          es.close();
          setTimeout(connect, 5000);
        }
      };
    };

    connect();

    return () => {
      stopped = true;
      es?.close();
    };
  }
}
