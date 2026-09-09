import { EvmParachain } from '@galacticcouncil/xc-core';

import { Binary } from 'polkadot-api';
import { Blake2256, compact, u64 } from '@polkadot-api/substrate-bindings';
import { fromHex, mergeUint8, toHex } from '@polkadot-api/utils';

import { config } from '../setup';

export const hydration = config.getChain('hydration') as EvmParachain;
export const api = hydration.client.getUnsafeApi();

/** pallet_evm dispatch precompile - runs a substrate call as its caller. */
export const DISPATCH = '0x0000000000000000000000000000000000000401';

/** Generous default for a pasted call; the form can edit it. */
export const DISPATCH_GAS = 6_000_000n;

// pallet_dispatcher. Hand-encoded: the descriptors predate the running spec
// and papi refuses the pallet as "incompatible", so every call is decoded
// back against the live metadata before it is offered for signing.
const P_DISPATCHER = 0x28;
const C_DISPATCH_EXTRA_GAS = 0x03;

export type Call = { type: string; value?: { type?: string } };

export type Decoded = {
  label: string;
  args: string;
};

export function callLabel(call: Call) {
  const inner = call.value?.type ? '.' + call.value.type : '';
  return call.type + inner;
}

export const stringify = (v: unknown) =>
  JSON.stringify(v, (_k, x) => {
    if (typeof x === 'bigint') return x.toString();
    if (x instanceof Uint8Array) return toHex(x);
    if (x && typeof x === 'object' && 'asHex' in x) {
      return (x as { asHex(): string }).asHex();
    }
    return x;
  });

/**
 * `Dispatcher.dispatch_with_extra_gas(call, 0)`.
 *
 * The precompile only admits normal-class calls; the wrapper is one, and
 * re-dispatches the inner call with the caller's own origin.
 */
export function wrap(inner: Uint8Array): Uint8Array {
  return mergeUint8([
    Uint8Array.of(P_DISPATCHER, C_DISPATCH_EXTRA_GAS),
    inner,
    u64.enc(0n),
  ]);
}

/**
 * Any pasted call, as the precompile takes it.
 *
 * Wrapped by default - see {@link wrap}; a normal-class call may skip it.
 */
export function buildCall(calldata: string, wrapped = true): Uint8Array {
  const bytes = fromHex(calldata.trim());
  if (bytes.length < 2) {
    throw new Error('Calldata is too short to be a call.');
  }
  return wrapped ? wrap(bytes) : bytes;
}

type DecodedCall = { type: string; value: { type: string; value: any } };

async function decodeCall(bytes: Uint8Array): Promise<DecodedCall> {
  const tx = await api.txFromCallData(Binary.fromHex(toHex(bytes)));
  return tx.decodedCall as DecodedCall;
}

/** The call inside a wrapper, or the call itself. */
function unwrap(call: DecodedCall): DecodedCall {
  return callLabel(call) === 'Dispatcher.dispatch_with_extra_gas'
    ? call.value.value.call
    : call;
}

/**
 * Decode a call against the live metadata and check what it dispatches.
 *
 * - Catches a pallet or call index that moved under a runtime upgrade
 * - What it returns is what the wallet is asked to sign
 *
 * @param expected - inner call the bytes must decode to, when known
 */
export async function describe(
  bytes: Uint8Array,
  expected?: 'vote' | 'close'
): Promise<Decoded> {
  const inner = unwrap(await decodeCall(bytes));
  const label = callLabel(inner);
  if (expected && label !== 'TechnicalCommittee.' + expected) {
    throw new Error('Call decodes as ' + label + ', refusing.');
  }
  return { label: label, args: stringify(inner.value.value) };
}

export type ProposePreview = {
  threshold: number;
  lengthBound: number;
  proposalHash: string;
  proposal: string;
  calls: number | null;
};

export type CallPreview = Decoded & {
  /** Set when the call is a `TechnicalCommittee.propose` */
  propose?: ProposePreview;
};

/**
 * Preview of a pasted call. A committee proposal also gets the hash the
 * proposal will be voted under, `blake2_256` of the inner call.
 */
export async function previewCall(calldata: string): Promise<CallPreview> {
  const bytes = fromHex(calldata.trim());
  const call = unwrap(await decodeCall(bytes));
  const preview: CallPreview = {
    label: callLabel(call),
    args: stringify(call.value.value),
  };
  if (preview.label !== 'TechnicalCommittee.propose') {
    return preview;
  }

  const value = call.value.value;
  const threshold = Number(value.threshold);
  const lengthBound = Number(value.length_bound);
  const proposal = value.proposal as DecodedCall;

  // Inner proposal bytes: the blob minus the call index and compact
  // threshold in front, and the compact length bound behind.
  const start = 2 + compact.enc(threshold).length;
  const end = bytes.length - compact.enc(lengthBound).length;
  const innerBytes = bytes.slice(start, end);

  preview.propose = {
    threshold: threshold,
    lengthBound: lengthBound,
    proposalHash: toHex(Blake2256(innerBytes)),
    proposal: callLabel(proposal),
    calls: Array.isArray(proposal.value?.value?.calls)
      ? proposal.value.value.calls.length
      : null,
  };
  return preview;
}
