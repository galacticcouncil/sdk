import { hexToBytes, type Hex } from 'viem';

import { BPS, FILL_TOLERANCE_BPS, TRIM_UNIT, WETH_ASSET_ID } from '../consts';
import type { OrderBase } from '../dispatcher';

import type { TradeContext } from './types';

const E18 = 10n ** 18n;

const ceilDiv = (a: bigint, b: bigint) => (a + b - 1n) / b;

/**
 * Quoted WETH less slippage.
 *
 * @param amountOut - quoted WETH, wei
 * @param slippage - percent; sdk-next's 1% when unset
 */
export function underSlippage(amountOut: bigint, slippage = 1): bigint {
  const bps = BigInt(Math.round(slippage * 100));
  return (amountOut * (BPS - bps)) / BPS;
}

/**
 * ICE forward to the dispatcher, as sdk-next's builders take it.
 *
 * @param ctx - trade context
 * @param data - forward calldata
 */
export function forwardOf(ctx: TradeContext, data: Hex) {
  return {
    contract: ctx.dispatcher.address,
    data: hexToBytes(data),
  };
}

/**
 * Input needed to buy `weth`; `weth` itself when selling WETH.
 *
 * @param ctx - trade context
 * @param assetIn - input asset
 * @param weth - WETH to buy, wei
 */
export async function wethIn(
  ctx: TradeContext,
  assetIn: number,
  weth: bigint
): Promise<bigint> {
  if (assetIn === WETH_ASSET_ID) return weth;
  const buy = await ctx.sdk.api.router.getBestBuy(assetIn, WETH_ASSET_ID, weth);
  return buy.amountIn;
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
