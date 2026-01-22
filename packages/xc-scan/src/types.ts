import { XcJourney } from './client';

export type XcStoreCallbacks = {
  /** Fired once after indexer fetch completes */
  onLoad?(items: XcJourney[]): void;

  /** Fired when a journey appears that wasn't in store before */
  onNew?(journey: XcJourney): void;

  /** Fired when an existing journey changes */
  onUpdate?(journey: XcJourney, prev: XcJourney): void;

  onOpen?(): void;
  onError?(err: any): void;
};
