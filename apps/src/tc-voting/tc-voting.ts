import { h160 } from '@galacticcouncil/common';

import { AccountId } from 'polkadot-api';
import { compact } from '@polkadot-api/substrate-bindings';
import { fromHex, mergeUint8, toHex } from '@polkadot-api/utils';

import { api, Call, callLabel, wrap } from '../dispatch/dispatch';

const { H160 } = h160;

// pallet_collective::<Instance2> (TechnicalCommittee). Hand-encoded like the
// wrapper it goes into - see ../dispatch/dispatch.ts.
const P_TC = 0x19;
const C_VOTE = 0x03;
const C_CLOSE = 0x06;

/**
 * Evm gas per action. The precompile checks the dispatched weight fits the
 * gas; close carries the proposal's own weight bound on top.
 */
export const Gas = {
  vote: 2_000_000n,
  close: 3_000_000n,
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

/** Open proposals with their tally, oldest first. */
export async function loadProposals(): Promise<Proposal[]> {
  const hashes =
    (await api.query.TechnicalCommittee.Proposals.getValue()) as string[];

  const rows = await Promise.all(
    hashes.map(async (hash) => {
      const [proposal, voting] = (await Promise.all([
        api.query.TechnicalCommittee.ProposalOf.getValue(hash),
        api.query.TechnicalCommittee.Voting.getValue(hash),
      ])) as [Call | undefined, Voting | undefined];
      if (!voting) return undefined;
      return {
        hash: hash,
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
