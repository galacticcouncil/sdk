import {
  OcelloidsHttpClient,
  OcelloidsSseClient,
  XcJourney,
  XcJourneyReplaceEvt,
} from './client';
import { XcJourneyBuilder } from './query';
import { XcStoreCallbacks } from './types';

export class XcStore {
  private readonly http: OcelloidsHttpClient;
  private readonly sse: OcelloidsSseClient;

  private store = new Map<string, XcJourney>();
  private replaced = new Map<string, string>();

  private unsubscribeSse?: () => void;

  constructor(httpClient: OcelloidsHttpClient, sseClient: OcelloidsSseClient) {
    this.http = httpClient;
    this.sse = sseClient;
  }

  private merge(prev: XcJourney, next: XcJourney): XcJourney {
    return { ...prev, ...next };
  }

  dump(): XcJourney[] {
    return Array.from(this.store.values()).sort(
      (a, b) => (b.sentAt ?? 0) - (a.sentAt ?? 0)
    );
  }

  unsubscribe() {
    this.unsubscribeSse?.();
    this.unsubscribeSse = undefined;
    this.store.clear();
  }

  async subscribe(address: string, cb: XcStoreCallbacks): Promise<void> {
    this.store.clear();

    const req = XcJourneyBuilder.journeys()
      .address(address)
      .build({ validate: true });

    const res = await this.http.queryCrosschain(req, { limit: 25 });
    for (const j of res.items) {
      this.store.set(j.correlationId, j);
    }

    // 1) Initial load
    cb.onLoad?.(this.dump());

    // 2) Live updates
    this.unsubscribeSse = this.sse.subscribe(req, {
      onOpen: () => cb.onOpen?.(),
      onError: (err) => cb.onError?.(err),
      onNewJourney: (journey: XcJourney) => {
        this.applyChanges(journey, cb);
      },
      onUpdateJourney: (journey: XcJourney) => {
        this.applyChanges(journey, cb);
      },
      onReplaceJourney: (replace: XcJourneyReplaceEvt) => {
        const {
          ids: { correlationId },
          replaces,
        } = replace;
        this.replaced.set(correlationId, replaces.correlationId);
      },
    });
  }

  private applyChanges(j: XcJourney, cb: XcStoreCallbacks) {
    const { correlationId } = j;

    const oldCorrelationId = this.replaced.get(correlationId);
    if (oldCorrelationId) {
      this.replaced.delete(correlationId);

      const oldJourney = this.store.get(oldCorrelationId);
      if (oldJourney) {
        this.store.delete(oldCorrelationId);
        this.store.set(correlationId, j);
        cb.onUpdate?.(j, oldJourney);
      } else {
        this.store.set(correlationId, j);
        cb.onNew?.(j);
      }
      return;
    }

    const prev = this.store.get(correlationId);

    if (!prev) {
      this.store.set(correlationId, j);
      cb.onNew?.(j);
      return;
    }

    const merged = this.merge(prev, j);
    this.store.set(correlationId, merged);
    cb.onUpdate?.(merged, prev);
  }
}
