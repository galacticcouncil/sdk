import { BPS, FILL_TOLERANCE_BPS, TRIM_UNIT } from '../consts';

const E18 = 10n ** 18n;

const ceilDiv = (a: bigint, b: bigint) => (a + b - 1n) / b;

/** What the dispatcher takes from an order before bridging it, and its least order. */
export interface OrderBase {
  /** Rail delivery price to Ethereum plus Wormhole's message fee, wei */
  cost: bigint;
  /** Dispatcher's `minOrderAmount`, wei */
  minOrderAmount: bigint;
}

/**
 * Least WETH one order must sell for any accepted fill to pay out at once.
 *
 * - What bridges is the WETH less `cost`, trimmed to the rail's precision
 * - That must cover the least order plus the ceiling, and twice the ceiling
 * - The worst accepted fill, `(bridged − C) × 0.99` at the hard floor, must reach `routeMin`
 *
 * @param base - dispatcher's cost and least order
 * @param maxRelayFee - relay ceiling the order carries, wei
 * @param minOutPerIn - hard floor, destination units per 1e18 wei
 * @param routeMin - route's `min_amount` in destination units; 0 where none
 * @throws when a route minimum is asked for without a floor
 */
export function minOrderWeth(
  base: OrderBase,
  maxRelayFee: bigint,
  minOutPerIn: bigint,
  routeMin: bigint
): bigint {
  if (routeMin > 0n && minOutPerIn === 0n) {
    throw new Error(
      "No hard floor: no order is sure to reach the route's minimum"
    );
  }
  const forRoute =
    routeMin > 0n
      ? maxRelayFee +
        ceilDiv(routeMin * E18 * BPS, minOutPerIn * (BPS - FILL_TOLERANCE_BPS))
      : 0n;
  const bridged = [
    base.minOrderAmount + maxRelayFee,
    2n * maxRelayFee,
    forRoute,
  ].reduce((a, b) => (b > a ? b : a));
  return base.cost + ceilDiv(bridged, TRIM_UNIT) * TRIM_UNIT;
}

/**
 * Worst output an order of `weth` may deliver to `A`.
 *
 * - Bridged amount after `cost` and trim, less the ceiling
 * - Sold at the hard floor, less the router's fill tolerance
 *
 * @param base - dispatcher's cost and least order
 * @param maxRelayFee - relay ceiling, wei
 * @param minOutPerIn - hard floor, destination units per 1e18 wei
 * @param weth - WETH the order sells, wei
 */
export function floorOut(
  base: OrderBase,
  maxRelayFee: bigint,
  minOutPerIn: bigint,
  weth: bigint
): bigint {
  if (weth <= base.cost) return 0n;
  const bridged = ((weth - base.cost) / TRIM_UNIT) * TRIM_UNIT;
  if (bridged <= maxRelayFee) return 0n;
  const eth = ((bridged - maxRelayFee) * (BPS - FILL_TOLERANCE_BPS)) / BPS;
  return (eth * minOutPerIn) / E18;
}

/**
 * Expected output of an order of `weth`.
 *
 * - Less the ceiling, at the live rate, less the terms' slippage
 * - Ignores `cost`, so it is an upper estimate
 *
 * @param weth - WETH one order bridges, wei
 * @param maxRelayFee - relay ceiling, wei
 * @param outPerIn - live rate, destination units per 1e18 wei
 * @param slippageBps - terms' `maxSlippageBps`
 */
export function estimateOut(
  weth: bigint,
  maxRelayFee: bigint,
  outPerIn: bigint,
  slippageBps: number
): bigint {
  const eth = weth > maxRelayFee ? weth - maxRelayFee : 0n;
  return (((eth * outPerIn) / E18) * (BPS - BigInt(slippageBps))) / BPS;
}
