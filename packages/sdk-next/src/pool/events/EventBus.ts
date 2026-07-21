import { TypedApi } from 'polkadot-api';

import { hydration } from '@galacticcouncil/descriptors';

import { Observable, map } from 'rxjs';

import { BlockEvents } from './types';

/**
 * The single upstream event source for pool sync.
 *
 * `System.Events` is one storage item read once per block, so a `watchValue`
 * emission carries that block's whole event vec ATOMICALLY — no cross-sub skew.
 * This is the property the event-driven sync leans on: everything in one
 * emission belongs to the same block, so a coupled multi-storage change can no
 * longer be observed torn across blocks.
 */
export class EventBus {
  constructor(private readonly api: TypedApi<typeof hydration>) {}

  watchBlockEvents(): Observable<BlockEvents> {
    return this.api.query.System.Events.watchValue({ at: 'best' }).pipe(
      map(({ block, value }) => ({
        block: { hash: block.hash, number: block.number },
        events: (value as any[]).map((r) => ({
          pallet: r.event.type,
          method: r.event.value.type,
          data: r.event.value.value,
        })),
      }))
    );
  }
}
