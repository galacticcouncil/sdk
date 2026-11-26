import { DEFAULT_SWAP_DEADLINE_MIN, MIN_FILL_MULTIPLIER } from '../consts';
import { swapDeadline } from '../terms/build';
import type { SwapParams, XcIntentsTrade } from '../types';

import { estimate, toTrade } from './estimate';
import { buildRequest } from './request';
import type { TradeContext } from './types';

/**
 * Estimates a swap: the whole amount sold at once, never partially.
 *
 * - Fill multiplier 2; payout at the route minimum
 * - Terms outlive the ICE intent by a grace hour
 * - `buildCall` yields an ICE swap into WETH, or `dispatch` calldata for WETH itself
 *
 * @param ctx - trade context
 * @param params - what the user asks for
 */
export async function swap(
  ctx: TradeContext,
  params: SwapParams
): Promise<XcIntentsTrade> {
  const est = await estimate(ctx, params, 'swap', (routeMin) => ({
    tranches: 1,
    amountInPerTrade: params.amountIn,
    maxFillMultiplier: MIN_FILL_MULTIPLIER,
    minDelivery: routeMin > 0n ? routeMin : 1n,
    errors: [],
  }));

  const minutes = params.deadlineMin ?? DEFAULT_SWAP_DEADLINE_MIN;
  return toTrade(est, () =>
    buildRequest(ctx, est, {
      deadlines: (now) => {
        const iceDeadline = BigInt(now + minutes * 60_000);
        return { iceDeadline, deadline: swapDeadline(iceDeadline) };
      },
      intentTx: (forward, iceDeadline) =>
        ctx.sdk.tx
          .intentMarket(est.sell!)
          .withBeneficiary(params.account)
          .withMinAmountOut(est.minWethOut)
          .withDeadline(iceDeadline!)
          .withForward(forward)
          .build(),
    })
  );
}
