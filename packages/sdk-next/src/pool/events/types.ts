import { BlockRef } from '../../api';

import { PoolBase } from '../types';

/**
 * One decoded `System.Events` record. papi decodes each record as
 * `{ phase, event: Enum, topics }`; we flatten the enum nesting:
 *   event.type        → pallet   ('Omnipool' | 'Broadcast' | 'Stableswap' | …)
 *   event.value.type  → method   ('Swapped3' | 'LiquidityAdded' | …)
 *   event.value.value → payload  (typed per (pallet, method))
 */
export interface DecodedEvent {
  /** Position in its block's event list; `block:index` identifies the record */
  index: number;
  pallet: string;
  method: string;
  data: any;
}

export interface BlockEvents {
  block: BlockRef;
  events: DecodedEvent[];
}

/**
 * One feed update, diffed against what the feed last delivered.
 *
 * - `applied`: canonical blocks to apply, ASCENDING; the last one is the tip
 * - `orphaned`: delivered blocks the feed now reports a different hash for
 * - `gap`: blocks were lost below the feed's window, so state must be reseeded
 */
export interface ChainUpdate {
  applied: BlockRef[];
  orphaned: BlockRef[];
  gap: boolean;
}

/**
 * One pass's sync context, computed once and shared by all clients.
 *
 * - `block` / `events`: the tip, resolved normally
 * - `below`: canonical blocks under the tip — gap-filled or reorg-replaced
 * - `orphaned`: blocks replaced at the same height; each client replays what
 *   IT matched there
 * - `below` and `orphaned` are replayed at the tip, not per block: handlers
 *   re-read absolute state, so only the newest read matters
 * - `eventsOf`: pinned events for a referenced block, read once per pass
 */
export interface BlockContext extends BlockEvents {
  below: BlockRef[];
  orphaned: BlockRef[];
  eventsOf(ref: BlockRef): Promise<DecodedEvent[]>;
}

/**
 * A read-modify-write of a single pool.
 *
 * - Produced by a handler's `resolve`
 * - Applied after the affected slice is read, pinned at the event's block
 */
export interface PoolMutation<T extends PoolBase> {
  address: string;
  apply: (pool: T) => T;
}

/**
 * Maps an event to the store mutation(s) it produces.
 *
 * - `match`   — cheap predicate over (pallet, method) [+ payload].
 * - `resolve` — resolve the mutation(s), reading any counterpart slice PINNED
 *               at `block.hash` (never `'best'`).
 */
export interface PoolEventHandler<T extends PoolBase> {
  match: (e: DecodedEvent) => boolean;
  resolve: (e: DecodedEvent, block: BlockRef) => Promise<PoolMutation<T>[]>;
}

/**
 * An event that drives a side effect, not a store write.
 *
 * - Refresh a cache, stash params, or request a resync
 * - Runs before the block's handlers and tick
 * - So anything the tick reads (oracle/peg caches, ramp params) is already fresh
 */
export interface PoolEventEffect {
  match: (e: DecodedEvent) => boolean;
  apply: (e: DecodedEvent, block: BlockRef) => Promise<void>;
}
