import {
  encoding,
  serializeLayout,
  type Layout,
} from '@wormhole-foundation/sdk-base';
import {
  RequestPrefix,
  UniversalAddress,
} from '@wormhole-foundation/sdk-definitions';

// Default (empty) transceiver instructions. Single zero byte, matching
// the internal default of NttManager.transfer(amount, chain, recipient).
// The delivery price is quoted for these exact instructions, so the fee
// builder and the contract builder must pass the same value.
export const NTT_DEFAULT_INSTRUCTIONS = '0x00';

// NTT wire format precision (TrimmedAmount).
export const NTT_TRIMMED_DECIMALS = 8;

export const EXECUTOR_API = 'https://executor.labsapis.com';

// Executor request body for an ntt v1 message, 70 bytes. The sdk ships the
// prefix enum but no layout for this. Note messageId is a full word, not the
// u64 the manager returns its sequence as.
const nttRequestLayout = [
  { name: 'prefix', binary: 'bytes', size: 4 },
  { name: 'srcChain', binary: 'uint', size: 2 },
  { name: 'srcManager', binary: 'bytes', size: 32 },
  { name: 'messageId', binary: 'uint', size: 32 },
] as const satisfies Layout;

/**
 * Names the ntt message an Executor request is paying to deliver.
 *
 * The sequence is the manager's `nextMessageSequence()` read at build time,
 * so a transfer through the same manager landing in between leaves the
 * request pointing at the wrong message. It relays nothing then, and the
 * transfer stays claimable by hand.
 */
export const encodeNttRequest = (
  srcWormholeId: number,
  nttManager: string,
  sequence: bigint
): `0x${string}` => {
  const request = serializeLayout(nttRequestLayout, {
    prefix: encoding.bytes.encode(RequestPrefix.ERN1),
    srcChain: srcWormholeId,
    srcManager: new UniversalAddress(nttManager, 'hex').toUint8Array(),
    messageId: sequence,
  });
  return encoding.hex.encode(request, true) as `0x${string}`;
};
