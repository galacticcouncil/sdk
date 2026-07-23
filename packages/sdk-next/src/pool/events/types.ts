import { PoolBase } from '../types';

/**
 * Block reference carried alongside a block's events.
 *
 * - `hash` pins slice reads to the emitting block
 * - `number` feeds the per-block tick and logs
 */
export interface BlockRef {
  hash: string;
  number: number;
}

/**
 * One decoded `System.Events` record. papi decodes each record as
 * `{ phase, event: Enum, topics }`; we flatten the enum nesting:
 *   event.type        → pallet   ('Omnipool' | 'Broadcast' | 'Stableswap' | …)
 *   event.value.type  → method   ('Swapped3' | 'LiquidityAdded' | …)
 *   event.value.value → payload  (typed per (pallet, method))
 */
export interface DecodedEvent {
  pallet: string;
  method: string;
  data: any;
}

export interface BlockEvents {
  block: BlockRef;
  events: DecodedEvent[];
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
