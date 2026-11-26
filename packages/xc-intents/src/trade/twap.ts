import { sor } from '@galacticcouncil/sdk-next';

import { DEFAULT_TWAP_PERIOD, MIN_TWAP_PERIOD, WETH_ASSET_ID } from '../consts';
import { twapDeadline, twapFillMultiplier } from '../terms/build';
import { XcIntentsError, type TwapParams, type XcIntentsTrade } from '../types';

import { estimate, toTrade } from './estimate';
import { buildRequest } from './request';
import type { Schedule, TradeContext } from './types';

/**
 * TWAP schedule once the route minimum is known.
 *
 * - Fill multiplier per tranche, so a fill can catch up missed trades
 * - Payout batch at least the route minimum
 *
 * @param params - what the user asks for
 * @param period - blocks between trades
 * @param routeMin - route minimum; 0 where none
 */
function twapSchedule(
  params: TwapParams,
  period: number,
  routeMin: bigint
): Schedule {
  const errors: XcIntentsError[] = [];
  const valid = Number.isInteger(params.tranches) && params.tranches >= 1;
  if (!valid) errors.push(XcIntentsError.InvalidTranches);
  if (period < MIN_TWAP_PERIOD) errors.push(XcIntentsError.InvalidPeriod);
  if (params.assetIn === WETH_ASSET_ID) errors.push(XcIntentsError.WethTwap);

  const minDelivery = params.minDelivery ?? (routeMin > 0n ? routeMin : 1n);
  if (minDelivery < routeMin) {
    errors.push(XcIntentsError.MinDeliveryBelowRouteMin);
  }

  const tranches = valid ? params.tranches : 1;
  return {
    tranches,
    amountInPerTrade: params.amountIn / BigInt(tranches),
    maxFillMultiplier: twapFillMultiplier(tranches),
    minDelivery,
    errors,
  };
}

/**
 * Estimates a TWAP: `amountIn` over `tranches` trades, `period` blocks apart.
 *
 * - Each trade is sized like a swap: its floor output reaches the route minimum
 * - So no remainder strands in `A`; a `minDelivery` above it batches payouts
 * - Tranches and period are the user's, so the order is built from one trade's quote
 *
 * @param ctx - trade context
 * @param params - what the user asks for
 */
export async function twap(
  ctx: TradeContext,
  params: TwapParams
): Promise<XcIntentsTrade> {
  const period = params.period ?? DEFAULT_TWAP_PERIOD;
  const est = await estimate(ctx, params, 'twap', (routeMin) =>
    twapSchedule(params, period, routeMin)
  );

  return toTrade(est, () =>
    buildRequest(ctx, est, {
      deadlines: (now) => ({
        deadline: twapDeadline(now, est.tranches, period),
      }),
      intentTx: async (forward) => {
        const sell = est.sell!;
        const tranches = BigInt(est.tranches);
        const weth = await ctx.getAsset(WETH_ASSET_ID);
        const order = {
          type: sor.TradeOrderType.TwapSell,
          assetIn: params.assetIn,
          assetOut: WETH_ASSET_ID,
          assetOutEd: weth.existentialDeposit,
          amountIn: est.amountInPerTrade * tranches,
          amountOut: sell.amountOut * tranches,
          tradeAmountIn: est.amountInPerTrade,
          tradeAmountOut: sell.amountOut,
          tradeCount: est.tranches,
          tradePeriod: period,
          tradeFee: sell.tradeFee * tranches,
          tradeImpactPct: sell.priceImpactPct,
          tradeRoute: [],
          errors: [],
          toHuman: () => ({}),
        } as sor.TradeOrder;

        const builder = ctx.sdk.tx
          .intentOrder(order)
          .withBeneficiary(params.account)
          .withMinAmountOut(est.minWethOut)
          .withForward(forward);
        if (params.slippage !== undefined) {
          builder.withSlippage(params.slippage);
        }
        return builder.build();
      },
    })
  );
}
