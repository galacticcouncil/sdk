import { TypedApi } from 'polkadot-api';

import { hydration } from '@galacticcouncil/descriptors';

import { log } from '@galacticcouncil/common';

import { Observable, filter, map, share } from 'rxjs';

import { BlockEvents, DecodedEvent } from './types';

const { logger } = log;

/**
 * The upstream event source for pool sync.
 *
 * - Owned by the pool sync driver, its only consumer
 */
export class EventBus {
  /** Multicast per-block stream */
  private readonly blockEvents$: Observable<BlockEvents>;

  /** Hash of the last delivered block, dedupes follower re-deliveries */
  private lastHash?: string;

  /**
   * @param api - typed api
   * @param at - feed to follow; `best` prices the market, `finalized` lags
   */
  constructor(
    private readonly api: TypedApi<typeof hydration>,
    private readonly at: 'best' | 'finalized' = 'best'
  ) {
    this.blockEvents$ = this.api.query.System.Events.watchValue({
      at: this.at,
    }).pipe(
      /**
       * The follower re-delivers the current best after a chainHead restart;
       * a re-delivery would double-apply handlers and pollute reorg history.
       */
      filter(({ block }) => {
        if (block.hash === this.lastHash) {
          logger.debug('event_bus redelivery :', { block: block.number });
          return false;
        }
        this.lastHash = block.hash;
        return true;
      }),
      map(({ block, value }) => ({
        block: { hash: block.hash, number: block.number },
        events: this.decode(value),
      })),
      share({ resetOnRefCountZero: false })
    );
  }

  watchBlockEvents(): Observable<BlockEvents> {
    return this.blockEvents$;
  }

  /**
   * Read a block's decoded events, PINNED at `at`.
   *
   * - Used to replay blocks the best-block watch skipped
   */
  async eventsAt(at: string): Promise<DecodedEvent[]> {
    const value = await this.api.query.System.Events.getValue({ at });
    return this.decode(value);
  }

  private decode(value: unknown): DecodedEvent[] {
    return (value as any[]).map((r) => ({
      pallet: r.event.type,
      method: r.event.value.type,
      data: r.event.value.value,
    }));
  }
}
