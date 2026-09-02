import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

/**
 * Verifies the block-stream primitives before we drive sync off them.
 *
 * Questions this must answer:
 * - `bestBlocks$`: newest-first or oldest-first? does it include the finalized
 *   block as the tail? one emission per new block, or coalesced?
 * - on a reorg, does the array carry the full replacement suffix?
 * - is our previous head still present (⇒ extension) or gone (⇒ reorg)?
 * - `finalizedBlock$`: every block exactly once, in order?
 */
class ProbeFeed extends PapiExecutor {
  async script(client: PolkadotClient) {
    const t0 = performance.now();
    const at = () => String(Math.round(performance.now() - t0)).padStart(6);
    const short = (h: string) => h.slice(0, 10);

    /** Previous emission, to classify the next one */
    let prev: { hash: string; number: number }[] = [];

    const subs = [
      client.bestBlocks$.subscribe((blocks) => {
        const head = blocks[0];
        const tail = blocks[blocks.length - 1];

        /**
         * Order: compare first vs last block number.
         */
        const order =
          blocks.length < 2
            ? 'single'
            : head.number > tail.number
              ? 'newest-first'
              : 'oldest-first';

        /**
         * Was the previous head kept (chain extended) or dropped (reorg)?
         */
        const hashes = new Set(blocks.map((b) => b.hash));
        const prevHead = prev[0];
        const kept = prevHead ? hashes.has(prevHead.hash) : true;
        const fresh = blocks.filter(
          (b) => !prev.some((p) => p.hash === b.hash)
        );

        console.log(
          `${at()}ms best[${String(blocks.length).padStart(2)}] ${order}` +
            ` head #${head.number} ${short(head.hash)}` +
            ` tail #${tail.number} ${short(tail.hash)}` +
            ` new=${fresh.length}` +
            (prevHead && !kept
              ? `  <-- REORG (prev head #${prevHead.number})`
              : '')
        );

        /**
         * More than one new block ⇒ the emission itself closes a gap, so a
         * consumer never needs to walk parentHash.
         */
        if (fresh.length > 1) {
          console.log(
            `        new blocks: ${fresh.map((b) => `#${b.number}`).join(' ')}`
          );
        }

        prev = blocks.map((b) => ({ hash: b.hash, number: b.number }));
      }),

      client.finalizedBlock$.subscribe((b) => {
        console.log(`${at()}ms finalized  #${b.number} ${short(b.hash)}`);
      }),
    ];

    await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 20));
    subs.forEach((s) => s.unsubscribe());
    return 'done';
  }
}

new ProbeFeed(ApiUrl.Catfish1, 'Probe block stream primitives').run();
