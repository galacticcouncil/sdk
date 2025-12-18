import {
  OcelloidsHttpClient,
  OcelloidsSseClient,
  XcJourney,
  XcJourneyRequest,
} from './client';
import { XcJourneyBuilder } from './query';

export class XcStore {
  private readonly http: OcelloidsHttpClient;
  private readonly sse: OcelloidsSseClient;

  private store = new Map<number, XcJourney>();
  private unsubscribeSse?: () => void;

  private callbacks = {
    onChange: () => {},
    onNewJourney: () => {},
    onUpdateJourney: () => {},
    onOpen: () => {},
    onError: () => {},
  };

  constructor(httpClient: OcelloidsHttpClient, sseClient: OcelloidsSseClient) {
    this.http = httpClient;
    this.sse = sseClient;
  }

  async subscribeByAddress(
    address: string,
    opts: {
      onNewJourney(journey: XcJourney, req: XcJourneyRequest): void;
      onUpdateJourney(journey: XcJourney, req: XcJourneyRequest): void;
      onOpen(): void;
      onError(error: any): void;
    }
  ): Promise<void> {
    this.store.clear();

    const req = XcJourneyBuilder.journeys()
      .address(address)
      .build({ validate: true });

    // 1) HTTP fetch
    const res = await this.http.queryCrosschain(req);
    for (const j of res) {
      this.store.set(j.id, j);
    }

    // 2) SSE subscribe
    this.unsubscribeSse = this.sse.subscribe(req, {
      onOpen: () => {},
      onError: (err) => {},
      onNewJourney: (j, req) => {
        this.store.set(j.id, j);
      },
      onUpdateJourney: (j, req) => {
        this.store.set(j.id, j);
      },
    });
  }

  unsubscribe(): void {
    this.unsubscribeSse?.();
    this.store.clear();
  }

  getJourneys(): XcJourney[] {
    return Array.from(this.store.values()).sort((a, b) => {
      const ta = (a as any).sentAt ?? 0;
      const tb = (b as any).sentAt ?? 0;
      return tb - ta;
    });
  }
}
