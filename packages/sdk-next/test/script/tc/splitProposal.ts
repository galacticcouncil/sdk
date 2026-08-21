import { readFileSync, writeFileSync } from 'fs';

import { Binary, PolkadotClient } from 'polkadot-api';
import { hydration } from '@galacticcouncil/descriptors';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

/* ========= CONFIG ========= */

// File holding a TechnicalCommittee.propose(utility.batch_all(...)) hex
// (as produced by buildRoutesProposal.ts).
const INPUT_FILE = 'tcProposal-routes-2026-06-30T09-26-57-835Z.txt';

// Max encoded size (bytes) of each proposal's inner batch_all. Calls are
// greedily packed up to this budget so every chunk stays small enough for a
// Ledger to parse and sign. Lower it if the Ledger still refuses (heavier
// multi-hop routes naturally land in smaller chunks).
const MAX_PROPOSAL_BYTES = 800;

const RPC = ApiUrl.Hydration;

/* ========= MAIN LOGIC ========= */

class SplitProposal extends PapiExecutor {
  async script(client: PolkadotClient) {
    const papi = client.getTypedApi(hydration);

    // Decode the existing proposal hex back into a call.
    const hex = readFileSync(INPUT_FILE, 'utf8').trim();
    const tx = await papi.txFromCallData(Binary.fromHex(hex));
    const decoded = tx.decodedCall as any;

    if (
      decoded.type !== 'TechnicalCommittee' ||
      decoded.value.type !== 'propose'
    ) {
      throw new Error(
        `Expected TechnicalCommittee.propose, got ${decoded.type}.${decoded.value.type}`
      );
    }

    const { threshold, proposal } = decoded.value.value;
    if (proposal.type !== 'Utility' || proposal.value.type !== 'batch_all') {
      throw new Error(
        `Expected Utility.batch_all, got ${proposal.type}.${proposal.value.type}`
      );
    }

    const calls: any[] = proposal.value.value.calls;
    console.log(
      `Decoded proposal: threshold ${threshold}, ${calls.length} call(s)`
    );

    // Greedily pack calls so each chunk's encoded batch stays within the
    // byte budget. A single call that alone exceeds the budget still gets
    // its own chunk.
    const groups: any[][] = [];
    let current: any[] = [];
    for (const call of calls) {
      const candidate = [...current, call];
      const size = (
        await papi.tx.Utility.batch_all({ calls: candidate }).getEncodedData()
      ).length;
      if (size > MAX_PROPOSAL_BYTES && current.length > 0) {
        groups.push(current);
        current = [call];
      } else {
        current = candidate;
      }
    }
    if (current.length > 0) groups.push(current);

    // Re-wrap each chunk as its own proposal, reusing the original threshold
    // and recomputing the length bound.
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    for (let i = 0; i < groups.length; i++) {
      const batch = papi.tx.Utility.batch_all({ calls: groups[i] });
      const lengthBound = (await batch.getEncodedData()).length;

      const part = papi.tx.TechnicalCommittee.propose({
        threshold,
        proposal: batch.decodedCall,
        length_bound: lengthBound,
      });
      const partHex = Binary.toHex(await part.getEncodedData());

      const file = `tcProposal-chunk${i + 1}of${groups.length}-${timestamp}.txt`;
      writeFileSync(file, partHex, 'utf8');
      console.log(
        `Chunk ${i + 1}/${groups.length}: ${groups[i].length} call(s), ${lengthBound} bytes -> ${file}`
      );
    }

    return () => client.destroy();
  }
}

new SplitProposal(RPC, 'Split a TC batch proposal into chunks').run();
