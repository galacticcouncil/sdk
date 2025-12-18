import { XcJourney } from './client';

export interface XcStoreState {
  journeys: XcJourney[];
  loading: boolean;
  error?: Error;
}

export type XcStoreListener = (state: XcStoreState) => void;
