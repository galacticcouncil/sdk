import {
  bytesToHex,
  bytesToString,
  concatHex,
  getAddress,
  hexToBigInt,
  hexToBytes,
  keccak256,
  numberToHex,
  stringToHex,
  type Hex,
} from 'viem';

import {
  BPS,
  MAX_FILL_MULTIPLIER,
  MIN_FILL_MULTIPLIER,
  TERMS_VERSION,
} from '../consts';

import { RecipientKind, type Terms } from './types';

/** Fixed bytes before `destinationAsset`, its length byte included. */
const HEADER_SIZE = 118;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO_BYTES32 = `0x${'0'.repeat(64)}`;

/** Big-endian unsigned, `size` bytes. */
const uint = (value: bigint | number, size: number): Hex =>
  numberToHex(BigInt(value), { size });

/** 1..255 bytes of visible ASCII — what the router parses. */
const isPrintable = (s: string): boolean =>
  s.length > 0 && s.length <= 255 && /^[\x21-\x7e]+$/.test(s);

/**
 * Checks terms against the codec's rules.
 *
 * - Mirrors the dispatcher's encoder, which reverts on the same input
 *
 * @param terms - terms to check
 * @throws when any field is out of range
 */
export function validateTerms(terms: Terms): void {
  const fail = (msg: string) => {
    throw new Error(`Invalid terms: ${msg}`);
  };
  if (terms.owner.toLowerCase() === ZERO_ADDRESS) fail('zero owner');
  if (terms.quoteId.toLowerCase() === ZERO_BYTES32) fail('zero quoteId');
  if (terms.maxSlippageBps < 0 || BigInt(terms.maxSlippageBps) >= BPS) {
    fail(`maxSlippageBps ${terms.maxSlippageBps}`);
  }
  if (
    terms.maxFillMultiplier < MIN_FILL_MULTIPLIER ||
    terms.maxFillMultiplier > MAX_FILL_MULTIPLIER
  ) {
    fail(`maxFillMultiplier ${terms.maxFillMultiplier}`);
  }
  if (terms.deadline === 0n) fail('zero deadline');
  if (
    terms.recipientKind !== RecipientKind.Withdraw &&
    terms.recipientKind !== RecipientKind.IntentsAccount
  ) {
    fail(`recipientKind ${terms.recipientKind}`);
  }
  if (terms.refundTo.toLowerCase() === ZERO_ADDRESS) fail('zero refundTo');
  if (!isPrintable(terms.destinationAsset)) fail('destinationAsset');
  if (!isPrintable(terms.recipient)) fail('recipient');
}

/**
 * Packs terms as the dispatcher's `computeTerms` does.
 *
 * - Big-endian, version byte first
 * - Strings are prefixed by a one-byte length
 *
 * @param terms - terms to encode
 */
export function encodeTerms(terms: Terms): Hex {
  validateTerms(terms);
  return concatHex([
    uint(TERMS_VERSION, 1),
    terms.owner,
    terms.quoteId,
    uint(terms.maxSlippageBps, 2),
    uint(terms.maxFillMultiplier, 1),
    uint(terms.minOutPerIn, 16),
    uint(terms.minDelivery, 16),
    uint(terms.deadline, 8),
    uint(terms.recipientKind, 1),
    terms.refundTo,
    uint(terms.destinationAsset.length, 1),
    stringToHex(terms.destinationAsset),
    uint(terms.recipient.length, 1),
    stringToHex(terms.recipient),
  ]).toLowerCase() as Hex;
}

/**
 * Unpacks terms encoded by {@link encodeTerms} or the dispatcher.
 *
 * - Requires exact length accounting of both strings
 *
 * @param encoded - packed terms
 * @throws when malformed or of another version
 */
export function decodeTerms(encoded: Hex): Terms {
  const b = hexToBytes(encoded);
  if (b.length < HEADER_SIZE + 1) {
    throw new Error(`Malformed terms: ${b.length} bytes`);
  }
  if (b[0] !== TERMS_VERSION) {
    throw new Error(`Unsupported terms version: ${b[0]}`);
  }

  let o = 1;
  const take = (n: number) => {
    if (o + n > b.length) throw new Error('Malformed terms: truncated');
    const s = b.subarray(o, o + n);
    o += n;
    return s;
  };
  const num = (n: number) => hexToBigInt(bytesToHex(take(n)));

  const owner = getAddress(bytesToHex(take(20)));
  const quoteId = bytesToHex(take(32));
  const maxSlippageBps = Number(num(2));
  const maxFillMultiplier = Number(num(1));
  const minOutPerIn = num(16);
  const minDelivery = num(16);
  const deadline = num(8);
  const recipientKind = Number(num(1)) as RecipientKind;
  const refundTo = getAddress(bytesToHex(take(20)));
  const destinationAsset = bytesToString(take(Number(num(1))));
  const recipient = bytesToString(take(Number(num(1))));
  if (o !== b.length) {
    throw new Error(`Malformed terms: ${b.length - o} trailing bytes`);
  }

  const terms: Terms = {
    owner,
    quoteId,
    maxSlippageBps,
    maxFillMultiplier,
    minOutPerIn,
    minDelivery,
    deadline,
    recipientKind,
    refundTo,
    destinationAsset,
    recipient,
  };
  validateTerms(terms);
  return terms;
}

/**
 * Terms' `auth_path`: the NEAR derivation path of their deposit account.
 *
 * - `0x` + lowercase hex; any other casing derives another account
 *
 * @param encoded - packed terms
 */
export function authPathOf(encoded: Hex): Hex {
  return keccak256(encoded).toLowerCase() as Hex;
}
