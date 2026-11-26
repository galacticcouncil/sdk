import { h160 } from '@galacticcouncil/common';

import { bytesToHex, getAddress, isAddress, type Hex } from 'viem';

import {
  BLOCK_TIME_MS,
  BPS,
  MAX_FILL_MULTIPLIER,
  MIN_FILL_MULTIPLIER,
  SWAP_TERMS_GRACE_S,
  TWAP_TERMS_GRACE_S,
} from '../consts';

import { RecipientKind, type Terms, type TermsFields } from './types';

/** 32 random bytes. */
export function randomQuoteId(): Hex {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

/**
 * EVM address ICE calls the dispatcher as.
 *
 * - An EVM address or ETH-prefixed account: its own address
 * - A plain substrate account: its truncated id
 *
 * @param account - Hydration account, SS58 or H160
 */
export function ownerOf(account: string): Hex {
  return getAddress(h160.H160.fromAny(account)) as Hex;
}

/**
 * Checksummed Ethereum refund address.
 *
 * - Mixed case must carry a valid checksum
 *
 * @param address - Ethereum address
 * @throws when not an address
 */
export function refundAddress(address: string): Hex {
  if (!isAddress(address, { strict: true })) {
    throw new Error(`Not an Ethereum refund address: ${address}`);
  }
  return getAddress(address) as Hex;
}

/**
 * Hard floor under the dispatcher's live rate.
 *
 * @param outPerIn - live rate, destination units per 1e18 wei
 * @param floorBps - how far under, bps
 */
export function floorOf(outPerIn: bigint, floorBps: number): bigint {
  return (outPerIn * (BPS - BigInt(floorBps))) / BPS;
}

/**
 * TWAP `maxFillMultiplier`: its tranche count, clamped.
 *
 * - A fill may then catch up every missed tranche
 *
 * @param tranches - number of trades
 */
export function twapFillMultiplier(tranches: number): number {
  return Math.min(
    MAX_FILL_MULTIPLIER,
    Math.max(MIN_FILL_MULTIPLIER, Math.floor(tranches))
  );
}

/**
 * Swap terms deadline: the ICE deadline plus a grace hour.
 *
 * @param iceDeadlineMs - ICE intent deadline, unix ms
 */
export function swapDeadline(iceDeadlineMs: bigint): bigint {
  return iceDeadlineMs / 1000n + BigInt(SWAP_TERMS_GRACE_S);
}

/**
 * TWAP terms deadline: the schedule's length plus two grace hours.
 *
 * @param startMs - submission time, unix ms
 * @param tranches - number of trades
 * @param period - blocks between trades
 */
export function twapDeadline(
  startMs: number,
  tranches: number,
  period: number
): bigint {
  const runMs = tranches * period * BLOCK_TIME_MS;
  return BigInt(Math.ceil((startMs + runMs) / 1000) + TWAP_TERMS_GRACE_S);
}

/**
 * Assembles terms from already sized parameters.
 *
 * @param params - term fields
 */
export function buildTerms(params: TermsFields): Terms {
  return {
    owner: ownerOf(params.account),
    quoteId: params.quoteId ?? randomQuoteId(),
    maxSlippageBps: params.maxSlippageBps,
    maxFillMultiplier: params.maxFillMultiplier,
    minOutPerIn: params.minOutPerIn,
    minDelivery: params.minDelivery,
    deadline: params.deadline,
    recipientKind: params.recipientKind ?? RecipientKind.Withdraw,
    refundTo: refundAddress(params.refundTo),
    destinationAsset: params.destinationAsset,
    recipient: params.recipient,
  };
}
