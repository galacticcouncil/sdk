import { PolkadotClient } from 'polkadot-api';
import { hydration } from '@galacticcouncil/descriptors';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { EvmClient } from '../../../src/evm';

const DURATION_MS = 30 * 60 * 1000;

/** Reads fired at each new tip, so a reorg has something in flight to kill */
const BURST = 40;

/** How long a read may stay unsettled before it counts as hung */
const PATIENCE_MS = 60_000;

type Outcome = 'pending' | 'resolved' | 'rejected';

interface Read {
  hash: string;
  block: number;
  at: number;
  outcome: Outcome;
  /** Fired after the block was known orphaned (case A) */
  post: boolean;
  ms?: number;
  error?: string;
  /** Was this read still in flight when its block was orphaned? (case B) */
  caught?: boolean;
}

const stats = {
  tips: 0,
  orphans: 0,
  /** In-flight-at-orphan (case B) */
  caught: 0,
  caughtResolved: 0,
  caughtRejected: 0,
  caughtHung: 0,
  /** Fired after the orphan was known (case A) */
  postResolved: 0,
  postRejected: 0,
  postHung: 0,
};

/**
 * Does a read pinned at an orphaned block settle?
 *
 * - papi pins the blocks it reports and unpins what a reorg drops; a read still
 *   targeting such a block may error, or may never produce its Done
 * - Case B is the engine's actual exposure: `applyBlock` reads at the tip, and
 *   the tip can be replaced while those reads are outstanding
 */
class VerifyReorg extends PapiExecutor {
  async script(client: PolkadotClient, _evm: EvmClient) {
    const api = client.getTypedApi(hydration);

    /** Height → hash, as last delivered */
    const delivered = new Map<number, string>();
    /** Every read we fired, by hash */
    const reads = new Map<string, Read[]>();

    const read = (hash: string, block: number, post: boolean) => {
      const entry: Read = {
        hash,
        block,
        post,
        at: Date.now(),
        outcome: 'pending',
      };

      const list = reads.get(hash) ?? [];
      list.push(entry);
      reads.set(hash, list);

      api.query.System.Number.getValue({ at: hash })
        .then(() => {
          entry.outcome = 'resolved';
          entry.ms = Date.now() - entry.at;
          if (post) stats.postResolved++;
          else if (entry.caught) stats.caughtResolved++;
          if (post || entry.caught) {
            console.log(
              `  ${post ? 'post' : 'caught'} resolved  ${short(hash)} ${entry.ms}ms`
            );
          }
        })
        .catch((e: Error) => {
          entry.outcome = 'rejected';
          entry.ms = Date.now() - entry.at;
          entry.error = e.message;
          if (post) stats.postRejected++;
          else if (entry.caught) stats.caughtRejected++;
          console.log(
            `  ${post ? 'post' : 'caught'} rejected  ${short(hash)} ${entry.ms}ms — ${e.message}`
          );
        });
    };

    const short = (hash: string) => `${hash.slice(0, 10)}…`;

    const sub = client.bestBlocks$.subscribe((chain) => {
      const current = new Map(chain.map((b) => [b.number, b.hash]));

      /**
       * A height we have seen before, now reporting a different hash: the one
       * we saw is off the canonical chain.
       */
      for (const [block, hash] of [...delivered]) {
        const now = current.get(block);
        if (!now || now === hash) continue;

        delivered.set(block, now);
        stats.orphans++;

        const inFlight = (reads.get(hash) ?? []).filter(
          (r) => r.outcome === 'pending'
        );
        for (const r of inFlight) {
          r.caught = true;
          stats.caught++;
        }

        console.log(
          `[orphan] #${block} ${short(hash)} → ${short(now)} · in flight ${inFlight.length}`
        );

        // Case A: a fresh read against a block we know is gone.
        read(hash, block, true);
      }

      const [tip] = chain;
      if (delivered.get(tip.number) === tip.hash) return;

      stats.tips++;
      for (const b of chain) delivered.set(b.number, b.hash);

      // Case B: give the next reorg something to catch.
      for (let i = 0; i < BURST; i++) read(tip.hash, tip.number, false);
    });

    console.log(`Watching for reorgs for ${DURATION_MS / 60000} min...`);
    await new Promise((resolve) => setTimeout(resolve, DURATION_MS));
    sub.unsubscribe();

    /** Anything unsettled past PATIENCE_MS never came back */
    for (const list of reads.values()) {
      for (const r of list) {
        if (r.outcome !== 'pending') continue;
        if (Date.now() - r.at < PATIENCE_MS) continue;
        if (r.caught) stats.caughtHung++;
        else if (r.post) stats.postHung++;
      }
    }

    return stats;
  }
}

new VerifyReorg(ApiUrl.Catfish1, 'Verify reads at orphaned blocks').run();
