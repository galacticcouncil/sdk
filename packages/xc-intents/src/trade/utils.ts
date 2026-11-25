import { hexToBytes, type Hex } from 'viem';

import { BPS, WETH_ASSET_ID } from '../consts';

import type { TradeContext } from './types';

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
