import type { Hex, PublicClient } from 'viem';

/** The viem reads the dispatcher needs. */
export type EvmReader = Pick<PublicClient, 'readContract'>;

/** Packed terms and their path, agreed on by the SDK and the dispatcher. */
export interface EncodedTerms {
  encoded: Hex;
  authPath: Hex;
}

/** What the dispatcher takes from an order before bridging it, and its least order. */
export interface OrderBase {
  /** Rail delivery price to Ethereum plus Wormhole's message fee, wei */
  cost: bigint;
  /** Dispatcher's `minOrderAmount`, wei */
  minOrderAmount: bigint;
}
