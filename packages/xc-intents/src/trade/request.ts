import type { Hex } from 'viem';

import { WETH_ASSET_ID, WETH_ERC20 } from '../consts';
import { ERC20_ABI, forwardData } from '../dispatcher';
import { depositAddressOf, oneClickDeposit, relayFeeCeiling } from '../quote';
import { buildTerms } from '../terms/build';
import type { XcIntentsRequest } from '../types';

import { buildDispatchCalls } from './builder';
import type { Estimate, IntentPlan, TradeContext } from './types';
import { forwardOf, minOrderWeth } from './utils';

/**
 * Fixes the terms of an estimate and builds what the owner signs.
 *
 * - Terms get a fresh quote id and deadlines from now
 * - Terms are encoded locally and on the dispatcher, and must agree
 * - `0xN` is used only once its quote names `A` as recipient and refund
 * - The relay ceiling is re-read; a rise past the order refuses the build
 * - WETH itself becomes approve + `dispatch` calldata; anything else an ICE intent
 *
 * @param ctx - trade context
 * @param est - a viable estimate
 * @param plan - swap or TWAP specifics
 * @throws when the estimate has errors, or any check fails
 */
export async function buildRequest(
  ctx: TradeContext,
  est: Estimate,
  plan: IntentPlan
): Promise<XcIntentsRequest> {
  if (est.errors.length) {
    throw new Error(
      `Cannot build a non-viable trade: ${est.errors.join(', ')}`
    );
  }

  const { params, schedule, destination } = est;
  const { deadline, iceDeadline } = plan.deadlines(Date.now());
  const terms = buildTerms({
    account: params.account,
    destinationAsset: destination.asset,
    recipient: params.recipient,
    recipientKind: est.recipientKind,
    refundTo: params.refundTo,
    maxSlippageBps: est.maxSlippageBps,
    maxFillMultiplier: schedule.maxFillMultiplier,
    minOutPerIn: est.minOutPerIn,
    minDelivery: schedule.minDelivery,
    deadline,
  });

  const { encoded, authPath } = await ctx.dispatcher.encode(terms);
  const depositAccount = await ctx.router.deriveAccount(authPath);

  const [deposit, maxRelayFee, orderBase] = await Promise.all([
    oneClickDeposit(depositAccount),
    relayFeeCeiling(ctx.quoterUrl, ctx.relayMarginBps),
    ctx.dispatcher.orderBase(),
  ]);
  const depositAddress = depositAddressOf(deposit, depositAccount);

  const least = minOrderWeth(
    orderBase,
    maxRelayFee,
    terms.minOutPerIn,
    destination.routeMin
  );
  if (est.minWethOut < least) {
    throw new Error(
      `Order of ${est.minWethOut} WETH is now under ${least}: estimate again`
    );
  }

  const forward = forwardData(depositAddress, maxRelayFee, encoded);
  const base = {
    terms,
    encoded,
    authPath,
    depositAccount,
    depositAddress,
    maxRelayFee,
  };

  if (params.assetIn === WETH_ASSET_ID) {
    const allowance = (await ctx.sdk.client.evm.getProvider().readContract({
      address: WETH_ERC20,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [terms.owner, ctx.dispatcher.address],
    })) as bigint;
    const calls = buildDispatchCalls({
      from: terms.owner,
      dispatcher: ctx.dispatcher.address as Hex,
      amount: est.amountIn,
      depositAddress,
      maxRelayFee,
      terms,
      approved: allowance >= est.amountIn,
    });
    return { ...base, kind: 'dispatch', calls };
  }

  const tx = await plan.intentTx(forwardOf(ctx, forward), iceDeadline);
  return { ...base, kind: 'intent', tx };
}
