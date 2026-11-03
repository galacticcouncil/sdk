import { CallType } from '@galacticcouncil/xc-core';
import { SubstrateCall } from '@galacticcouncil/xc-sdk';

import { AccountId } from 'polkadot-api';
import { Blake2256, compact } from '@polkadot-api/substrate-bindings';
import { mergeUint8, toHex } from '@polkadot-api/utils';

import {
  api,
  callLabel,
  Decoded,
  decodeCall,
  describe,
  unwrap,
} from '../dispatch/dispatch';

// pallet_parameters, and TechnicalCommittee for motions. Hand-encoded like
// the wrapper - see ../dispatch/dispatch.ts.
const P_PARAMETERS = 0x53;
const P_TC = 0x19;
const C_PROPOSE = 0x02;

/** Parameters calls that switch xcm, by call index. */
const CALLS = {
  suspend_xcm_send: 2,
  resume_xcm_send: 3,
  suspend_xcm_execution: 4,
  resume_xcm_execution: 5,
  suspend_xcm: 6,
  resume_xcm: 7,
} as const;

export type XcmCall = keyof typeof CALLS;

export type State = {
  /** Outbound refused by the xcm router */
  sendSuspended: boolean;
  /** Inbound left queued, unexecuted */
  executionSuspended: boolean;
  /** Committee seats, as public keys */
  seats: string[];
  /** Open committee motions, by proposal hash */
  motions: string[];
  block: number;
};

export type Motion = {
  call: XcmCall;
  label: string;
  /** Whether the call would change anything now */
  applies: (state: State) => boolean;
  note?: string;
};

/**
 * Switches only the authority origin may throw, as committee motions.
 *
 * - A single seat can only suspend both sides at once
 * - The one-sided calls fail when that side is already where they put it
 */
export const MOTIONS: Motion[] = [
  {
    call: 'suspend_xcm_send',
    label: 'Suspend outbound only',
    applies: (s) => !s.sendSuspended,
    note: 'Inbound messages that send onward fail - their assets stay in the asset trap.',
  },
  {
    call: 'suspend_xcm_execution',
    label: 'Suspend inbound only',
    applies: (s) => !s.executionSuspended,
  },
  {
    call: 'resume_xcm',
    label: 'Resume all',
    applies: (s) => s.sendSuspended || s.executionSuspended,
  },
  {
    call: 'resume_xcm_send',
    label: 'Resume outbound',
    applies: (s) => s.sendSuspended,
  },
  {
    call: 'resume_xcm_execution',
    label: 'Resume inbound',
    applies: (s) => s.executionSuspended,
    note: 'Runs everything queued while suspended.',
  },
];

const pubkey = (address: string) => toHex(AccountId().enc(address));

export async function loadState(): Promise<State> {
  const at = { at: 'best' } as const;
  const [send, execution, members, proposals, block] = await Promise.all([
    api.query.Parameters.XcmSendSuspended.getValue(at),
    api.query.Parameters.XcmExecutionSuspended.getValue(at),
    api.query.TechnicalCommittee.Members.getValue(at),
    api.query.TechnicalCommittee.Proposals.getValue(at),
    api.query.System.Number.getValue(at),
  ]);
  return {
    sendSuspended: send as boolean,
    executionSuspended: execution as boolean,
    seats: (members as string[]).map(pubkey),
    motions: proposals as string[],
    block: Number(block),
  };
}

/** Whether `address` holds a seat - matched on public keys. */
export function isSeat(state: State, address: string): boolean {
  try {
    return state.seats.includes(pubkey(address));
  } catch {
    // Not a substrate address, e.g. an ethereum account in the extension.
    return false;
  }
}

/**
 * Ayes a motion needs.
 *
 * - The authority origin is a 2/3 committee super-majority
 * - A lower threshold still closes, then fails its call with `BadOrigin`
 */
export const ayesNeeded = (state: State) =>
  Math.ceil((2 * state.seats.length) / 3);

const xcmCall = (call: XcmCall) => Uint8Array.of(P_PARAMETERS, CALLS[call]);

/** `Parameters.suspend_xcm` - the one switch a single seat may throw. */
export const buildSuspend = () => xcmCall('suspend_xcm');

/** `TechnicalCommittee.propose` of `call`, passing at `ayes`. */
export function buildMotion(call: XcmCall, ayes: number): Uint8Array {
  const proposal = xcmCall(call);
  return mergeUint8([
    Uint8Array.of(P_TC, C_PROPOSE),
    compact.enc(ayes),
    proposal,
    compact.enc(proposal.length),
  ]);
}

/** Hash the motion of `call` is voted under. */
export const motionHash = (call: XcmCall) => toHex(Blake2256(xcmCall(call)));

/**
 * Decode `bytes` back against the live metadata and check they switch `call`.
 *
 * - A motion is checked twice: the propose, and the call it carries
 * - Accepts bytes wrapped for the dispatch precompile
 */
export async function check(
  bytes: Uint8Array,
  call: XcmCall,
  motion: boolean
): Promise<Decoded> {
  const label = 'Parameters.' + call;
  if (!motion) {
    return describe(bytes, label);
  }
  const { proposal } = unwrap(await decodeCall(bytes)).value.value ?? {};
  if (!proposal || callLabel(proposal) !== label) {
    throw new Error('Motion does not carry ' + label + ', refusing.');
  }
  return describe(bytes, 'TechnicalCommittee.propose');
}

export const substrateCall = (
  from: string,
  bytes: Uint8Array
): SubstrateCall => ({
  from: from,
  data: toHex(bytes),
  type: CallType.Substrate,
  txOptions: undefined,
  dryRun: async () => undefined,
});
