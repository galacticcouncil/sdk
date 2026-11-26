import type { Asset, SdkCtx, sor, tx } from '@galacticcouncil/sdk-next';

import type { Hex } from 'viem';

import type { IntentDispatcher, OrderBase } from '../dispatcher';
import type { IntentRouter, UtxoRoute } from '../router';
import type { RecipientKind, Terms } from '../terms/types';
import type {
  Destination,
  TradeParams,
  XcIntentsError,
  XcIntentsTrade,
} from '../types';

/** Resolved configuration the trade flows need (defaults applied). */
export interface TradeContext {
  sdk: SdkCtx;
  dispatcher: IntentDispatcher;
  router: IntentRouter;
  quoterUrl: string;
  /** Relay ceiling headroom, bps */
  relayMarginBps: number;
  /** Hydration asset by runtime id; cached by the client */
  getAsset: (id: number) => Promise<Asset>;
}

/** How a swap or a TWAP splits and batches, once the route minimum is known. */
export interface Schedule {
  tranches: number;
  amountInPerTrade: bigint;
  maxFillMultiplier: number;
  minDelivery: bigint;
  errors: XcIntentsError[];
}

/** A sized trade: everything `buildRequest` needs, and the trade shown. */
export interface Estimate extends Omit<XcIntentsTrade, 'buildCall' | 'route'> {
  params: TradeParams;
  recipientKind: RecipientKind;
  route?: UtxoRoute;
  schedule: Schedule;
  minOutPerIn: bigint;
  maxSlippageBps: number;
  orderBase: OrderBase;
  /** Hydration sell of one trade; none when selling WETH itself */
  sell?: sor.Trade;
  /** Destination as priced */
  destination: Destination;
}

/** What differs between a swap and a TWAP when the terms are fixed. */
export interface IntentPlan {
  /**
   * Terms deadline, and the ICE deadline for a swap.
   *
   * @param now - unix ms
   */
  deadlines(now: number): { deadline: bigint; iceDeadline?: bigint };
  /**
   * The ICE intent, forwarded to the dispatcher.
   *
   * @param forward - forward of the fixed terms
   * @param iceDeadline - ICE deadline, unix ms
   */
  intentTx(forward: tx.IntentForward, iceDeadline?: bigint): Promise<tx.Tx>;
}

/** Inputs to {@link buildDispatchCalls}. */
export interface BuildDispatchParams {
  /** Terms owner, the `from` of every call */
  from: string;
  dispatcher: Hex;
  /** WETH sold, wei */
  amount: bigint;
  depositAddress: Hex;
  maxRelayFee: bigint;
  terms: Terms;
  /** Dispatcher already holds the allowance; skips the approve */
  approved: boolean;
}

/** Inputs to {@link buildCloseCalls}. */
export interface BuildCloseParams {
  /** Terms owner */
  from: string;
  dispatcher: Hex;
  terms: Terms;
  /** Countdown, seconds */
  delay: number;
  /** Wormhole message fee, paid as `close`'s value */
  messageFee: bigint;
}
