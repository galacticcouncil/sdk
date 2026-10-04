import { hydration } from '@galacticcouncil/descriptors';

import type { EventRecord } from './events';
import type { Fork } from './network';

/**
 * A block's events at an explicit hash.
 *
 * - Retried: the papi client lags the block the chain just sealed
 */
export async function getEventsAt(
  fork: Fork,
  blockHash: string,
  tries = 12
): Promise<EventRecord[]> {
  const api = fork.client.getTypedApi(hydration);
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await api.query.System.Events.getValue({ at: blockHash });
    } catch (e) {
      lastErr = e;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  throw lastErr;
}
