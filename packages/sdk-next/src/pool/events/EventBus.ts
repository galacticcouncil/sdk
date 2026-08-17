import { PolkadotClient, TypedApi } from 'polkadot-api';

import { hydration } from '@galacticcouncil/descriptors';

import { Observable, filter, map, share } from 'rxjs';

import { ChainUpdate, DecodedEvent } from './types';

import { BlockRef } from '../../api';

/**
 * The chain feed for pool sync.
 *
 * - Follows `bestBlocks$`, NOT a storage watch: it carries the whole
 *   unfinalized chain (best → finalized) on every change, so one emission
 *   closes a gap or replaces a reorged suffix
 * - Diffs each emission against the last, so gaps and reorgs come out of the
 *   feed itself — no `parentHash` walking, no header reads
 * - Owned by the pool sync driver, its only consumer
 */
export class EventBus {
  private readonly api: TypedApi<typeof hydration>;

  /** Multicast feed updates */
  private readonly chain$: Observable<ChainUpdate>;

  /** Chain as last delivered, newest-first */
  private delivered: BlockRef[] = [];

  /**
   * @param client - polkadot client
   */
  constructor(private readonly client: PolkadotClient) {
    this.api = client.getTypedApi(hydration);

    const ref = (b: { hash: string; number: number }): BlockRef => ({
      hash: b.hash,
      number: b.number,
    });

    this.chain$ = this.client.bestBlocks$.pipe(
      map((bs) => bs.map(ref)),
      map((chain) => this.diff(chain)),
      /**
       * A finality-only change prunes the window without adding blocks.
       */
      filter(({ applied }) => applied.length > 0),
      share({ resetOnRefCountZero: false })
    );
  }

  watchChain(): Observable<ChainUpdate> {
    return this.chain$;
  }

  /**
   * Read a block's decoded events, PINNED at `at`.
   *
   * - Used for the blocks under the tip: gap-filled or reorg-replaced
   */
  async eventsAt(at: string): Promise<DecodedEvent[]> {
    const value = await this.api.query.System.Events.getValue({ at });
    return this.decode(value);
  }

  /**
   * Diff the feed's chain against what it last delivered.
   *
   * - First update applies only the head: blocks under it are already
   *   reflected in the snapshot a client seeds from it
   * - A height that dropped out of the window was finalized, NOT replaced, so
   *   orphaning is decided by a differing hash AT the same height
   */
  private diff(chain: BlockRef[]): ChainUpdate {
    const prev = this.delivered;
    this.delivered = chain;

    if (prev.length === 0) {
      return { applied: chain.slice(0, 1), orphaned: [], gap: false };
    }

    const byNumber = new Map(chain.map((b) => [b.number, b.hash]));
    const seen = new Set(prev.map((b) => b.hash));
    const ascending = (a: BlockRef, b: BlockRef) => a.number - b.number;

    const applied = chain.filter((b) => !seen.has(b.hash)).sort(ascending);
    const orphaned = prev
      .filter((b) => {
        const canonical = byNumber.get(b.number);
        return canonical !== undefined && canonical !== b.hash;
      })
      .sort(ascending);

    /**
     * Lagged further than the feed's window: the blocks in between are gone.
     */
    const tip = prev.reduce((max, b) => Math.max(max, b.number), 0);
    const gap = applied.length > 0 && applied[0].number > tip + 1;

    return { applied, orphaned, gap };
  }

  private decode(value: unknown): DecodedEvent[] {
    return (value as any[]).map((r, index) => ({
      index,
      pallet: r.event.type,
      method: r.event.value.type,
      data: r.event.value.value,
    }));
  }
}
