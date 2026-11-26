import {
  DEFAULT_FLOOR_BPS,
  DEFAULT_MAX_SLIPPAGE_BPS,
  DESTINATION_ASSETS,
  DESTINATION_DECIMALS,
  PAYOUT_FEES,
  WETH_ASSET_ID,
} from '../consts';
import { estimateOut, floorOut, minOrderWeth } from '../order/sizing';
import { relayFeeCeiling } from '../quote';
import { floorOf, refundAddress } from '../terms/build';
import { RecipientKind } from '../terms/types';
import {
  XcIntentsError,
  type TradeParams,
  type XcIntentsRequest,
  type XcIntentsTrade,
} from '../types';

import type { Estimate, Schedule, TradeContext } from './types';
import { underSlippage, wethIn } from './utils';

/**
 * Sizes a swap or a TWAP against live state.
 *
 * - Viability problems land in `errors`; config and network failures throw
 * - Every order's floor output reaches the route minimum, so it pays out alone
 * - Reads the rate, route, relay ceiling, order cost and the Hydration sell
 * - Calls no pass-through backend: terms are fixed only in `buildCall`
 *
 * @param ctx - trade context
 * @param params - what the user asks for
 * @param kind - swap or TWAP
 * @param plan - the schedule, given the route minimum
 * @throws when the destination or input asset is unsupported
 */
export async function estimate(
  ctx: TradeContext,
  params: TradeParams,
  kind: XcIntentsTrade['kind'],
  plan: (routeMin: bigint) => Schedule
): Promise<Estimate> {
  const asset = params.destination;
  const symbol = Object.entries(DESTINATION_ASSETS).find(
    ([, a]) => a === asset
  )?.[0];
  if (!symbol) throw new Error(`Unsupported destination: ${asset}`);

  const [assetIn, weth] = await Promise.all([
    ctx.getAsset(params.assetIn),
    ctx.getAsset(WETH_ASSET_ID),
  ]);
  const recipientKind = params.recipientKind ?? RecipientKind.Withdraw;
  const maxSlippageBps = params.maxSlippageBps ?? DEFAULT_MAX_SLIPPAGE_BPS;
  const errors: XcIntentsError[] = [];

  const [routes, outPerIn, maxRelayFee, orderBase, recipientOk] =
    await Promise.all([
      ctx.router.utxoRoutes(),
      ctx.dispatcher.outPerIn(asset),
      relayFeeCeiling(ctx.quoterUrl, ctx.relayMarginBps),
      ctx.dispatcher.orderBase(),
      ctx.router.checkRecipient(asset, recipientKind, params.recipient).then(
        () => true,
        () => false
      ),
    ]);

  if (!recipientOk) errors.push(XcIntentsError.RecipientRejected);
  try {
    refundAddress(params.refundTo);
  } catch {
    errors.push(XcIntentsError.InvalidRefundAddress);
  }
  if (!outPerIn) errors.push(XcIntentsError.Unpriced);

  const route =
    recipientKind === RecipientKind.Withdraw ? routes[asset] : undefined;
  const routeMin = route ? BigInt(route.min_amount) : 0n;
  const schedule = plan(routeMin);
  errors.push(...schedule.errors);

  const rate = outPerIn ?? 0n;
  const minOutPerIn = floorOf(rate, params.floorBps ?? DEFAULT_FLOOR_BPS);
  const least = minOrderWeth(
    orderBase,
    maxRelayFee,
    minOutPerIn,
    minOutPerIn > 0n ? routeMin : 0n
  );

  const perTrade = schedule.amountInPerTrade;
  if (perTrade < assetIn.existentialDeposit) {
    errors.push(XcIntentsError.BelowExistentialDeposit);
  }

  const isWeth = params.assetIn === WETH_ASSET_ID;
  const sell =
    isWeth || perTrade === 0n
      ? undefined
      : await ctx.sdk.api.router.getBestSell(
          params.assetIn,
          WETH_ASSET_ID,
          perTrade
        );
  const wethOut = isWeth ? perTrade : (sell?.amountOut ?? 0n);
  const minWethOut = isWeth ? wethOut : underSlippage(wethOut, params.slippage);
  if (minWethOut < least || minWethOut < weth.existentialDeposit) {
    errors.push(XcIntentsError.OrderTooSmall);
  }

  const tranches = BigInt(schedule.tranches);
  const bridged = wethOut > orderBase.cost ? wethOut - orderBase.cost : 0n;
  const amountOut =
    tranches * estimateOut(bridged, maxRelayFee, rate, maxSlippageBps);
  const minAmountOut =
    tranches * floorOut(orderBase, maxRelayFee, minOutPerIn, minWethOut);

  const destination = {
    symbol,
    asset,
    decimals: DESTINATION_DECIMALS[asset],
    outPerIn: rate,
    routeMin,
    payoutFee: PAYOUT_FEES[asset],
  };

  return {
    kind,
    params,
    recipientKind,
    destination,
    route,
    schedule,
    amountIn: params.amountIn,
    amountInPerTrade: perTrade,
    tranches: schedule.tranches,
    wethOut,
    minWethOut,
    least,
    leastIn: await wethIn(ctx, params.assetIn, least),
    amountOut,
    minAmountOut,
    minOutPerIn,
    maxSlippageBps,
    orderBase,
    sell,
    fees: {
      maxRelayFee,
      orderCost: orderBase.cost,
      payout: destination.payoutFee,
    },
    errors: [...new Set(errors)],
  };
}

/**
 * Public trade of an estimate.
 *
 * @param est - sized trade
 * @param buildCall - commits the trade
 */
export function toTrade(
  est: Estimate,
  buildCall: () => Promise<XcIntentsRequest>
): XcIntentsTrade {
  return {
    kind: est.kind,
    destination: est.destination,
    route: est.route,
    amountIn: est.amountIn,
    amountInPerTrade: est.amountInPerTrade,
    tranches: est.tranches,
    wethOut: est.wethOut,
    minWethOut: est.minWethOut,
    least: est.least,
    leastIn: est.leastIn,
    amountOut: est.amountOut,
    minAmountOut: est.minAmountOut,
    fees: est.fees,
    errors: est.errors,
    buildCall,
  };
}
