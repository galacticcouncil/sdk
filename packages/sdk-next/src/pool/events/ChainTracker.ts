import { PolkadotClient } from 'polkadot-api';

import { AppliedBlock, BlockRef, DecodedEvent } from './types';

/**
 * Recent blocks kept for reorg replay — the deepest reorg healed in place.
 */
const REORG_DEPTH = 16;

/**
 * Tracks the applied best chain for one sync cycle.
 *
 * - Cursor + a bounded ring of applied blocks (`REORG_DEPTH`)
 * - Classifies each delivery: a forward gap to backfill, or a reorg
 * - Splits a reorg window into orphaned and displaced-canonical blocks
 * - Repairs the ring after a heal so stale residue can't replay
 */
export class ChainTracker {
  private history: AppliedBlock[] = [];
  private lastBlock = 0;
  private lastHash?: string;

  constructor(private readonly client: PolkadotClient) {}

  /**
   * Pin the cursor at the seed block.
   *
   * - The seed snapshot is already coherent; nothing to replay
   */
  seed(block: BlockRef): void {
    this.lastBlock = block.number;
    this.lastHash = block.hash;
  }

  /**
   * Classify a delivered block against the applied tip.
   *
   * - Walks `parentHash` back to `lastBlock + 1`
   * - `missed`: canonical blocks between the tip and `block`, ascending
   * - `reorg`: the block's chain doesn't build on the tip we applied — either
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
     * else the chain forked at or below the tip we applied.
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
   * - Walks the new tip's `parentHash` back until it rejoins the applied chain
   * - `orphaned`: applied blocks NOT on the new chain, to reread at the tip
   * - `canonical`: new-chain blocks that displaced them (ascending), whose
   *   events the driver never saw; capped at `lastBlock` — heights above it
   *   are the gap-backfill range, resolved separately
   * - A forward reorg pairs them 1:1 (one same-height replacement per
   *   orphaned block), so `depth === canon` in the reorg log
   * - `canon < depth` ⇒ tip at same/lower height (replacements arrive as
   *   future blocks); `canon > depth` ⇒ ring hole in the orphaned range
   * - Bounded by the reorg depth (one hop for a depth-1 reorg), not the ring
   */
  async split(
    block: BlockRef
  ): Promise<{ orphaned: AppliedBlock[]; canonical: BlockRef[] }> {
    const orphaned: AppliedBlock[] = [];
    const canonical: BlockRef[] = [];
    let hash = block.hash;
    let number = block.number;

    for (let i = this.history.length - 1; i >= 0; i--) {
      const h = this.history[i];
      if (h.number > number) {
        orphaned.push(h); // applied above the new tip → orphaned
        continue;
      }
      while (number > h.number) {
        hash = (await this.client.getBlockHeader(hash as `0x${string}`))
          .parentHash;
        number -= 1;
        if (number <= this.lastBlock) canonical.push({ number, hash });
      }
      if (hash === h.hash) {
        canonical.pop(); // the rejoin block itself is applied, not displaced
        break;
      }
      orphaned.push(h);
    }
    return { orphaned, canonical: canonical.reverse() };
  }

  /**
   * Repair the ring after a heal.
   *
   * - Drop the orphaned entries; splice in the canonical replacements
   */
  repair(orphaned: AppliedBlock[], replaced: AppliedBlock[]): void {
    for (const o of orphaned) {
      const i = this.history.indexOf(o);
      if (i !== -1) this.history.splice(i, 1);
    }
    for (const r of replaced) {
      this.remember(r);
    }
  }

  /**
   * Ring insert of an applied block.
   */
  remember(applied: AppliedBlock): void {
    this.history.push(applied);
    if (this.history.length > REORG_DEPTH) this.history.shift();
  }

  /**
   * Remember the driven block and advance the cursor.
   */
  apply(block: BlockRef, touched: DecodedEvent[]): void {
    this.remember({ number: block.number, hash: block.hash, touched });
    this.lastBlock = block.number;
    this.lastHash = block.hash;
  }
}
