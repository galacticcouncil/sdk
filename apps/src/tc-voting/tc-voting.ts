import { EvmParachain } from '@galacticcouncil/xc-core';
import { h160 } from '@galacticcouncil/common';

import { AccountId, Binary } from 'polkadot-api';
import { Blake2256, compact, u64 } from '@polkadot-api/substrate-bindings';
import { fromHex, mergeUint8, toHex } from '@polkadot-api/utils';

import { config } from '../setup';

const { H160 } = h160;

export const hydration = config.getChain('hydration') as EvmParachain;
const api = hydration.client.getUnsafeApi();

/** pallet_evm dispatch precompile - runs a substrate call as its caller. */
export const DISPATCH = '0x0000000000000000000000000000000000000401';

// pallet_collective::<Instance2> (TechnicalCommittee) and pallet_dispatcher.
// Hand-encoded: the descriptors predate the running spec and papi refuses
// both pallets as "incompatible", so every call is decoded back against the
// live metadata before it is offered for signing (see `describe`).
const P_TC = 0x19;
const C_PROPOSE = 0x02;
const C_VOTE = 0x03;
const C_CLOSE = 0x06;
const P_DISPATCHER = 0x28;
const C_DISPATCH_EXTRA_GAS = 0x03;

/**
 * Evm gas per action. The precompile checks the dispatched weight fits the
 * gas; close carries the proposal's own weight bound on top.
 */
export const Gas = {
  vote: 2_000_000n,
  close: 3_000_000n,
  propose: 6_000_000n,
};

// close() bounds - upper bounds the chain checks the actual against, so a
// generous estimate is always safe and covers any normal governance call.
const CLOSE_WEIGHT_REF_TIME = 5_000_000_000n;
const CLOSE_WEIGHT_PROOF_SIZE = 500_000n;
const CLOSE_LENGTH_BOUND = 10_000n;

const pubkey = (address: string) => toHex(AccountId().enc(address));

export type Proposal = {
  hash: string;
  index: number;
  label: string;
  threshold: number;
  ayes: string[];
  nays: string[];
  end: number;
};

export type Member = {
  /** Evm address the wallet holds */
  address: string;
  /** Substrate account it acts as on chain */
  account: string;
  isMember: boolean;
};

export type Decoded = {
  label: string;
  args: string;
};

export type ProposeDecoded = Decoded & {
  threshold: number;
  lengthBound: number;
  proposalHash: string;
  calls: number | null;
};

function callLabel(call: Call) {
  const inner = call.value?.type ? '.' + call.value.type : '';
  return call.type + inner;
}

const stringify = (v: unknown) =>
  JSON.stringify(v, (_k, x) => {
    if (typeof x === 'bigint') return x.toString();
    if (x instanceof Uint8Array) return toHex(x);
    if (x && typeof x === 'object' && 'asHex' in x) {
      return (x as { asHex(): string }).asHex();
    }
    return x;
  });

/**
 * Who the wallet address is on chain, and whether that holds a seat.
 *
 * Membership is matched on public keys - the members list and the mapped
 * account may carry different ss58 prefixes.
 */
export async function memberOf(address: string): Promise<Member> {
  const account = H160.toAccount(address);
  const members =
    (await api.query.TechnicalCommittee.Members.getValue()) as string[];
  const wanted = pubkey(account);
  return {
    address: address,
    account: account,
    isMember: members.some((m) => pubkey(m) === wanted),
  };
}

export async function currentBlock(): Promise<number> {
  return Number(await api.query.System.Number.getValue({ at: 'best' }));
}

type Voting = {
  index: number;
  threshold: number;
  ayes: string[];
  nays: string[];
  end: number;
};

type Call = { type: string; value?: { type?: string } };

/** Open proposals with their tally, oldest first. */
export async function loadProposals(): Promise<Proposal[]> {
  const hashes = (await api.query.TechnicalCommittee.Proposals.getValue()) as {
    asHex(): string;
  }[];

  const rows = await Promise.all(
    hashes.map(async (hash) => {
      const [proposal, voting] = (await Promise.all([
        api.query.TechnicalCommittee.ProposalOf.getValue(hash),
        api.query.TechnicalCommittee.Voting.getValue(hash),
      ])) as [Call | undefined, Voting | undefined];
      if (!voting) return undefined;
      return {
        hash: hash.asHex(),
        index: Number(voting.index),
        label: proposal ? callLabel(proposal) : 'unknown',
        threshold: Number(voting.threshold),
        ayes: voting.ayes.map(pubkey),
        nays: voting.nays.map(pubkey),
        end: Number(voting.end),
      };
    })
  );

  return rows
    .filter((r): r is Proposal => !!r)
    .sort((a, b) => a.index - b.index);
}

export function hasVoted(proposal: Proposal, member: Member): boolean {
  const key = pubkey(member.account);
  return proposal.ayes.includes(key) || proposal.nays.includes(key);
}

// --- calls ---

function wrap(inner: Uint8Array): Uint8Array {
  return mergeUint8([
    Uint8Array.of(P_DISPATCHER, C_DISPATCH_EXTRA_GAS),
    inner,
    u64.enc(0n),
  ]);
}

export function buildVote(proposal: Proposal, approve: boolean): Uint8Array {
  return wrap(
    mergeUint8([
      Uint8Array.of(P_TC, C_VOTE),
      fromHex(proposal.hash),
      compact.enc(proposal.index),
      Uint8Array.of(approve ? 1 : 0),
    ])
  );
}

export function buildClose(proposal: Proposal): Uint8Array {
  return wrap(
    mergeUint8([
      Uint8Array.of(P_TC, C_CLOSE),
      fromHex(proposal.hash),
      compact.enc(proposal.index),
      compact.enc(CLOSE_WEIGHT_REF_TIME),
      compact.enc(CLOSE_WEIGHT_PROOF_SIZE),
      compact.enc(CLOSE_LENGTH_BOUND),
    ])
  );
}

/** A pasted `TechnicalCommittee.propose`, wrapped for the precompile. */
export function buildPropose(calldata: string): Uint8Array {
  const bytes = fromHex(calldata.trim());
  if (bytes[0] !== P_TC || bytes[1] !== C_PROPOSE) {
    throw new Error('Calldata is not a TechnicalCommittee.propose call.');
  }
  return wrap(bytes);
}

/**
 * Decode a wrapped call against the live metadata and check its shape.
 *
 * - Catches a pallet or call index that moved under a runtime upgrade
 * - What it returns is what the wallet is asked to sign
 */
export async function describe(
  wrapped: Uint8Array,
  expected: 'vote' | 'close' | 'propose'
): Promise<Decoded> {
  const tx = await api.txFromCallData(Binary.fromHex(toHex(wrapped)));
  const outer = tx.decodedCall as {
    type: string;
    value: { type: string; value: { call: { type: string; value: any } } };
  };
  const label = callLabel(outer);
  if (label !== 'Dispatcher.dispatch_with_extra_gas') {
    throw new Error('Encoded call decodes as ' + label + ', refusing.');
  }
  const inner = outer.value.value.call;
  const innerLabel = callLabel(inner);
  if (innerLabel !== 'TechnicalCommittee.' + expected) {
    throw new Error('Wrapped call decodes as ' + innerLabel + ', refusing.');
  }
  return { label: innerLabel, args: stringify(inner.value.value) };
}

/**
 * Preview of a pasted propose call: what it proposes and the hash the
 * proposal will get, `blake2_256` of the inner call.
 */
export async function decodePropose(calldata: string): Promise<ProposeDecoded> {
  const wrapped = buildPropose(calldata);
  const base = await describe(wrapped, 'propose');

  const tx = await api.txFromCallData(Binary.fromHex(calldata.trim()));
  const value = (tx.decodedCall as any).value.value;
  const threshold = Number(value.threshold);
  const lengthBound = Number(value.length_bound);
  const proposal = value.proposal;

  // Inner proposal bytes: the blob minus the call index and compact
  // threshold in front, and the compact length bound behind.
  const bytes = fromHex(calldata.trim());
  const start = 2 + compact.enc(threshold).length;
  const end = bytes.length - compact.enc(lengthBound).length;
  const innerBytes = bytes.slice(start, end);

  return {
    label: callLabel(proposal),
    args: base.args,
    threshold: threshold,
    lengthBound: lengthBound,
    proposalHash: toHex(Blake2256(innerBytes)),
    calls: Array.isArray(proposal.value?.value?.calls)
      ? proposal.value.value.calls.length
      : null,
  };
}
