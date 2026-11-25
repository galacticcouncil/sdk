import type { SdkCtx, tx } from '@galacticcouncil/sdk-next';
import type { EvmCall } from '@galacticcouncil/xc-sdk';

import type { Hex } from 'viem';

import type { NearReader, UtxoRoute } from './near/router';
import type { PassThroughProvider } from './quote';
import type { RecipientKind, Terms } from './terms/types';

export interface XcIntentsOpts {
  /** sdk-next context: router, assets, EVM client, tx builders */
  sdk: SdkCtx;
  /** Backend making the 1Click pass-through to `A` */
  passThrough: PassThroughProvider;
  /** NEAR reads; a `NearClient` on `nearRpc` when omitted */
  near?: NearReader;
  nearRpc?: string;
  dispatcher?: string;
  router?: string;
  mpcSigner?: string;
  quoterUrl?: string;
  scanUrl?: string;
  /** Relay ceiling headroom, bps */
  relayMarginBps?: number;
}

/** A destination the dispatcher prices now. */
export interface Destination {
  symbol: string;
  /** Intents ledger id */
  asset: string;
  decimals: number;
  /** Live rate, destination units per 1e18 wei */
  outPerIn: bigint;
  /** Least the router pays out at once; 0 where none */
  routeMin: bigint;
  /** Payout fee on the destination chain, destination units */
  payoutFee: bigint;
}

/** What the user asks for, common to a swap and a TWAP. */
export interface TradeParams {
  /** Hydration account signing */
  account: string;
  /** Hydration asset sold */
  assetIn: number;
  /** Total sold, smallest unit */
  amountIn: bigint;
  /** Intents ledger id bought */
  destination: string;
  recipient: string;
  /** Withdraw to the asset's chain unless set */
  recipientKind?: RecipientKind;
  /** Ethereum address refunds go to, as native ETH */
  refundTo: string;
  /** Under the quoted WETH, percent; 1 when unset */
  slippage?: number;
  /** Hard floor under the live rate, bps */
  floorBps?: number;
  /** Slippage the router may quote under, bps */
  maxSlippageBps?: number;
}

/** One swap: sold at once, never partially. */
export interface SwapParams extends TradeParams {
  /** ICE intent lifetime, minutes */
  deadlineMin?: number;
}

/**
 * A TWAP: `amountIn` split over `tranches` trades, `period` blocks apart.
 *
 * - Each trade sells `amountIn / tranches`; the remainder stays with the user
 */
export interface TwapParams extends TradeParams {
  tranches: number;
  /** Blocks between trades, at least 15 */
  period?: number;
  /** Payout batch size, at least the route minimum */
  minDelivery?: bigint;
}

/** Viability problems, reported on the trade instead of thrown. */
export enum XcIntentsError {
  /** Router would not pay the recipient */
  RecipientRejected = 'RecipientRejected',
  /** Refund address is not a checksummed Ethereum address */
  InvalidRefundAddress = 'InvalidRefundAddress',
  /** Dispatcher has no live rate for the destination */
  Unpriced = 'Unpriced',
  /** Amount per trade is under the input asset's existential deposit */
  BelowExistentialDeposit = 'BelowExistentialDeposit',
  /** Least WETH per order is under `least` */
  OrderTooSmall = 'OrderTooSmall',
  /** TWAP's floor output can't reach the route minimum */
  ScheduleBelowRouteMin = 'ScheduleBelowRouteMin',
  /** TWAP payout batch is under the route minimum */
  MinDeliveryBelowRouteMin = 'MinDeliveryBelowRouteMin',
  /** TWAP period is under 15 blocks */
  InvalidPeriod = 'InvalidPeriod',
  /** TWAP tranche count is not a positive integer */
  InvalidTranches = 'InvalidTranches',
  /** ICE can't TWAP WETH itself */
  WethTwap = 'WethTwap',
}

/** Fees outside the user's slippage, disclosed before signing. */
export interface XcIntentsFees {
  /** Relay ceiling per order, wei */
  maxRelayFee: bigint;
  /** Rail delivery plus Wormhole fee per order, wei */
  orderCost: bigint;
  /** Payout on the destination chain, destination units */
  payout: bigint;
}

/** An estimated swap or TWAP. */
export interface XcIntentsTrade {
  kind: 'swap' | 'twap';
  destination: Destination;
  /** Payout route, for UTXO destinations */
  route?: UtxoRoute;
  /** Total sold, smallest unit */
  amountIn: bigint;
  /** Sold per trade; `amountIn` for a swap */
  amountInPerTrade: bigint;
  tranches: number;
  /** Quoted WETH per trade, wei */
  wethOut: bigint;
  /** Least WETH per trade after slippage, wei */
  minWethOut: bigint;
  /** Least WETH per order the dispatcher and route take, wei */
  least: bigint;
  /** `least` in the input asset */
  leastIn: bigint;
  /** Expected destination output in total */
  amountOut: bigint;
  /** Worst accepted destination output in total, at the hard floor */
  minAmountOut: bigint;
  fees: XcIntentsFees;
  /** Viability problems; empty when executable */
  errors: XcIntentsError[];

  /**
   * Fixes the terms and builds what the owner signs.
   *
   * - Re-reads the relay ceiling, which moves with gas
   * - Calls the pass-through backend
   */
  buildCall(): Promise<XcIntentsRequest>;
}

/** What one action needs signed, and how to find it later. */
export type XcIntentsRequest = {
  terms: Terms;
  /** Packed terms */
  encoded: Hex;
  authPath: Hex;
  /** Deposit account on NEAR */
  depositAccount: string;
  /** 1Click pass-through on Ethereum */
  depositAddress: Hex;
  /** Relay ceiling the order carries, wei */
  maxRelayFee: bigint;
} & (
  | {
      /** ICE intent, forwarded to the dispatcher */
      kind: 'intent';
      tx: tx.Tx;
    }
  | {
      /** Direct WETH order: approve and `dispatch` */
      kind: 'dispatch';
      calls: EvmCall[];
    }
);
