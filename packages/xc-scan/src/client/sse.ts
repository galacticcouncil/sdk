import { XcJourney, XcJourneyRequest } from './types';

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
      onOpen(): void;
      onError(error: any): void;
    }
  ): () => void {
    const url = `${this._baseUrl}/sse/crosschain/default`;

    const criteria = Object.entries(request.criteria || {}).map(
      ([key, value]) => [key, String(value)]
    );

    const urlParams = new URLSearchParams(criteria).toString();
    const eventSource = new EventSource(`${url}?${urlParams}`);

    eventSource.onopen = opts.onOpen;

    eventSource.addEventListener('update_journey', (e) =>
      opts.onUpdateJourney(JSON.parse(e.data), request)
    );

    eventSource.addEventListener('new_journey', (e) =>
      opts.onNewJourney(JSON.parse(e.data), request)
    );

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      opts.onError(error);

      if (eventSource.readyState === EventSource.CLOSED) {
        console.warn('SSE connection closed by server.');
      }
    };

    return () => {
      eventSource.close();
    };
  }
}
