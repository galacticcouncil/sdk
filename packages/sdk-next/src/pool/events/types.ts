import { PoolBase } from '../types';

/**
 * Minimal block reference carried alongside a block's events. `hash` pins slice
 * reads to the emitting block; `number` feeds the gated tick / logs.
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
 * A read-modify-write of a single pool. Produced by a handler's `resolve` after
 * the affected slice has been read (pinned at the event's block).
 */
export interface PoolMutation<T extends PoolBase> {
  address: string;
  apply: (pool: T) => T;
}

/**
 * Maps a decoded event to the pool slice(s) it dirties.
 *
 * - `match`   — cheap predicate over (pallet, method) [+ payload].
 * - `resolve` — resolve the mutation(s), reading any counterpart slice PINNED
 *               at `block.hash` (never `'best'`). Returns [] if nothing to do.
 */
export interface PoolEventHandler<T extends PoolBase> {
  match: (e: DecodedEvent) => boolean;
  resolve: (e: DecodedEvent, block: BlockRef) => Promise<PoolMutation<T>[]>;
}
