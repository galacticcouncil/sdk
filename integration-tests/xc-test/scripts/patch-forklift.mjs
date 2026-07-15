/**
 * Patch @polkadot-api/forklift so it delivers XCM to OLDER-cumulus chains.
 *
 * `ParachainSystem.set_validation_data` has two signatures in the wild:
 *
 *   OLD (Hydration): set_validation_data(data)
 *     -> messages live INSIDE `data`, as
 *        downward_messages:   Vec<InboundDownwardMessage>
 *        horizontal_messages: BTreeMap<ParaId, Vec<InboundHrmpMessage>>
 *
 *   NEW (Bifrost, AssetHub): set_validation_data(data, inbound_messages_data)
 *     -> `data` has no message fields; they go in a separate
 *        InboundMessagesData { full_messages, hashed_messages }
 *
 * forklift@0.4.1 only builds the NEW form. On an old-cumulus chain the messages
 * are handed to a parameter that doesn't exist, papi drops them, and the runtime
 * receives nothing — while forklift has already advanced the channel's MQC head
 * in the relay state proof. cumulus then hits
 *
 *     assert!(cur_head == target_head)   // enqueue_inbound_horizontal_messages
 *
 * which is a bare `assert!`, not a `panic!`, so it traps as
 * `wasm 'unreachable' instruction executed` with NO message. That is the entire
 * reason this was so hard to find.
 *
 * The fix populates the old-form fields too. papi drops keys that are absent from
 * a runtime's type, so each chain picks up whichever signature it declares — no
 * version detection needed, and new-cumulus chains are unaffected.
 *
 * Remove this once the fix is upstream in forklift.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const TARGET =
  'node_modules/@polkadot-api/forklift/dist/src/block-builder/set-validation-data.js';

const MARKER = 'OLDER cumulus';

const FIND = `    relay_chain_state: newNodes.map((node) => Binary.fromHex(node)),
    relay_parent_descendants: updatedDescendants
  };
  const inbound_messages_data = {`;

const REPLACE = `    relay_chain_state: newNodes.map((node) => Binary.fromHex(node)),
    relay_parent_descendants: updatedDescendants,
    // OLDER cumulus declares set_validation_data(data) with the messages INSIDE
    // \`data\`. papi drops keys absent from the runtime's type, so new-cumulus
    // chains ignore these and keep using inbound_messages_data below.
    downward_messages: xcm.dmp.map(({ msg, sent_at }) => ({ sent_at, msg })),
    horizontal_messages: allIngressSenders.map((senderId) => [
      senderId,
      (xcm.hrmp[senderId] ?? []).map((data2) => ({
        sent_at: nextRelayNumber,
        data: data2
      }))
    ])
  };
  const inbound_messages_data = {`;

if (!existsSync(TARGET)) {
  console.log('[patch-forklift] forklift not installed, skipping');
  process.exit(0);
}

const src = readFileSync(TARGET, 'utf8');

if (src.includes(MARKER)) {
  console.log('[patch-forklift] already patched');
  process.exit(0);
}

if (!src.includes(FIND)) {
  console.error(
    '[patch-forklift] FAILED: anchor not found — forklift changed upstream.\n' +
      '  Re-check whether the inherent-shape bug is fixed there before dropping this patch.'
  );
  process.exit(1);
}

writeFileSync(TARGET, src.replace(FIND, REPLACE));
console.log('[patch-forklift] patched set-validation-data.js (old-cumulus XCM delivery)');
