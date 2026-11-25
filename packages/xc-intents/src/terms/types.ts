import type { Hex } from 'viem';

/** How the router delivers to `recipient`. */
export enum RecipientKind {
  /** Withdraw to the asset's own chain */
  Withdraw = 0,
  /** Transfer to a NEAR intents account */
  IntentsAccount = 1,
}

/**
 * Terms of one action — one swap, or one whole TWAP.
 *
 * - Every field is hashed into the deposit account `A`
 * - Changing any field makes a new action
 */
export interface Terms {
  /** EVM address ICE calls the dispatcher as */
  owner: Hex;
  /** Random per action */
  quoteId: Hex;
  /** Slippage the router may quote under, bps */
  maxSlippageBps: number;
  /** One fill sells at most this many times its order */
  maxFillMultiplier: number;
  /** Hard floor, destination units per 1e18 wei */
  minOutPerIn: bigint;
  /** Least `A` holds before a delivery, destination units */
  minDelivery: bigint;
  /** Unix seconds */
  deadline: bigint;
  recipientKind: RecipientKind;
  /** Ethereum address refunds go to, as native ETH */
  refundTo: Hex;
  /** Intents ledger id, e.g. `nep141:zec.omft.near` */
  destinationAsset: string;
  recipient: string;
}

/** Fields of one set of terms, already sized — `buildTerms`' input. */
export interface TermsFields {
  /** Hydration account submitting the intent */
  account: string;
  destinationAsset: string;
  recipient: string;
  recipientKind?: RecipientKind;
  refundTo: string;
  maxSlippageBps: number;
  maxFillMultiplier: number;
  minOutPerIn: bigint;
  minDelivery: bigint;
  deadline: bigint;
  /** Fixed for reproducible terms; random otherwise */
  quoteId?: Hex;
}
