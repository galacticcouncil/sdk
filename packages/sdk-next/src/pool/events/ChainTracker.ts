import { PolkadotClient } from 'polkadot-api';

import { BlockRef } from './types';

/**
 * Recent blocks kept for reorg replay — the deepest reorg healed in place.
 *
 * - Bounds both this tracker's lineage ring and each client's matched-event ring
 */
export const REORG_DEPTH = 16;

/**
 * Tracks the delivered best chain for one sync session.
 *
 * - Cursor + a bounded ring of block refs (`REORG_DEPTH`)
 * - Classifies each delivery: a forward gap to backfill, or a reorg
 * - Splits a reorg window into orphaned and displaced-canonical blocks
 * - Repairs the ring so stale residue can't be replayed by a later reorg
 * - Lineage only: matched events stay with the client that matched them
 */
export class ChainTracker {
  private history: BlockRef[] = [];
  private lastBlock = 0;
  private lastHash?: string;

  constructor(private readonly client: PolkadotClient) {}

  /** Whether the cursor has been pinned by a first delivery */
  get seeded(): boolean {
    return this.lastHash !== undefined;
  }

  /**
   * Classify a delivered block against the delivered tip.
   *
   * - Walks `parentHash` back to `lastBlock + 1`
   * - `missed`: canonical blocks between the tip and `block`, ascending
   * - `reorg`: the block's chain doesn't build on the tip we tracked — either
   *   it didn't advance past it, or the ancestry at `lastBlock` diverged
   */
  async classify(
    block: BlockRef
  ): Promise<{ missed: BlockRef[]; reorg: boolean }> {
    if (block.number <= this.lastBlock) return { missed: [], reorg: true };

    const missed: BlockRef[] = [];
    let hash = block.hash;
    let number = block.number;
    while (number > this.lastBlock + 1) {
      const header = await this.client.getBlockHeader(hash as `0x${string}`);
      hash = header.parentHash;
      number -= 1;
      missed.push({ number, hash });
    }

    /**
     * `hash` is now the block at `lastBlock + 1`; its parent must be our tip,
     * else the chain forked at or below the tip we tracked.
     */
    const header = await this.client.getBlockHeader(hash as `0x${string}`);
    return {
      missed: missed.reverse(),
      reorg: header.parentHash !== this.lastHash,
    };
  }

  /**
   * Split a reorg window against `block`'s canonical chain.
   *
   * - Walks the new tip's `parentHash` back until it rejoins the tracked chain
   * - `orphaned`: tracked blocks NOT on the new chain, to reread at the tip
   * - `canonical`: new-chain blocks that displaced them (ascending), whose
   *   events no client saw; capped at `lastBlock` — heights above it are the
   *   gap-backfill range, resolved separately
   * - A forward reorg pairs them 1:1 (one same-height replacement per
   *   orphaned block), so `depth === canon` in the reorg log
   * - `canon < depth` ⇒ tip at same/lower height (replacements arrive as
   *   future blocks); `canon > depth` ⇒ ring hole in the orphaned range
   * - Bounded by the reorg depth (one hop for a depth-1 reorg), not the ring
   */
  async split(
    block: BlockRef
  ): Promise<{ orphaned: BlockRef[]; canonical: BlockRef[] }> {
    const orphaned: BlockRef[] = [];
    const canonical: BlockRef[] = [];
    let hash = block.hash;
    let number = block.number;

    for (let i = this.history.length - 1; i >= 0; i--) {
      const h = this.history[i];
      if (h.number > number) {
        orphaned.push(h); // tracked above the new tip → orphaned
        continue;
      }
      while (number > h.number) {
        hash = (await this.client.getBlockHeader(hash as `0x${string}`))
          .parentHash;
        number -= 1;
        if (number <= this.lastBlock) canonical.push({ number, hash });
      }
      if (hash === h.hash) {
        canonical.pop(); // the rejoin block itself is tracked, not displaced
        break;
      }
      orphaned.push(h);
    }
    return { orphaned, canonical: canonical.reverse() };
  }

  /**
   * Repair the ring after a reorg.
   *
   * - Drop the orphaned entries; splice in the canonical replacements
   */
  repair(orphaned: BlockRef[], canonical: BlockRef[]): void {
    for (const o of orphaned) {
      const i = this.history.indexOf(o);
      if (i !== -1) this.history.splice(i, 1);
    }
    for (const c of canonical) {
      this.remember(c);
    }
  }

  /**
   * Ring insert of a tracked block.
   */
  remember(block: BlockRef): void {
    this.history.push(block);
    if (this.history.length > REORG_DEPTH) this.history.shift();
  }

  /**
   * Remember the delivered block and advance the cursor.
   */
  apply(block: BlockRef): void {
    this.remember(block);
    this.lastBlock = block.number;
    this.lastHash = block.hash;
  }
}
