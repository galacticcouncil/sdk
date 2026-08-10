import {
  AnyChain,
  Asset,
  Ntt as NttRegistry,
  NttTokenDef,
} from '@galacticcouncil/xc-core';

import { ExecutorBudget } from '../wormhole';

/**
 * Rate limit of one direction of an ntt manager.
 *
 * `capacity` is the headroom right now - the manager refills it linearly over
 * `windowMs`. A `windowMs` of 0 means the direction is not metered at all.
 */
export interface NttRateLimit {
  capacity: bigint;
  limit: bigint;
  windowMs: number;
  capacityAtLastTx: bigint;
  lastTxMs: number;
}

/**
 * The ntt deployment on one chain, for one asset.
 *
 * Both halves of a transfer read the same deployment: the rate limits decide
 * whether it is allowed through, the redeem budget decides what delivering it
 * costs. Keyed on the chain the question is about - an inbound limit and a
 * redeem budget are both destination-side.
 */
export interface NttClient {
  getOutboundLimit(): Promise<NttRateLimit>;
  getInboundLimit(from: AnyChain): Promise<NttRateLimit>;
  /**
   * What the Executor must reserve to redeem this transfer.
   *
   * @param recipient - whose accounts the redeem may have to open. Without it
   * the budget assumes the worst case rather than reading chain.
   */
  getRedeemBudget(recipient?: string): Promise<ExecutorBudget>;
}

export const UNMETERED: NttRateLimit = {
  capacity: 0n,
  limit: 0n,
  windowMs: 0,
  capacityAtLastTx: 0n,
  lastTxMs: 0,
};

/**
 * Deployment for the asset this client was built for.
 *
 * Resolved per call rather than in the constructor: a redeem budget on an evm
 * or sui destination never reads the registry, so constructing a client for an
 * unregistered asset must not throw on its own.
 */
export function nttDef(chain: AnyChain, asset?: Asset): NttTokenDef {
  if (!asset) {
    throw new Error('No ntt asset given for ' + chain.name + '.');
  }
  return NttRegistry.fromChain(chain, asset);
}

/** Mirrors the manager's linear refill (rate_limit::capacity_at). */
export function capacityAt(
  limit: bigint,
  capacityAtLastTx: bigint,
  lastTxTimestamp: bigint,
  now: bigint,
  duration: bigint
): bigint {
  const elapsed = now > lastTxTimestamp ? now - lastTxTimestamp : 0n;
  const refilled = capacityAtLastTx + (limit * elapsed) / duration;
  return refilled < limit ? refilled : limit;
}
