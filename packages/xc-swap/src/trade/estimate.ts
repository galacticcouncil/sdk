import { AssetAmount } from '@galacticcouncil/xc-core';
import type { sor } from '@galacticcouncil/sdk-next';

import { keccak256, encodeAbiParameters } from 'viem';

import { buildCalls } from './build';
import { fetchMaxRelayFee } from '../quote/relayFee';
import { configureOneClick, getOneClickQuote } from '../quote/oneClick';
import {
  WETH_ID,
  GLMR_ID,
  WETH_DECIMALS,
  WRAP_NEAR_ASSET,
  toErc20,
} from '../registry/consts';
import type { XcSwapAsset, XcSwapParams, XcSwapTrade } from '../types';

const BPS = 10_000n;

/** Resolved configuration the estimator needs (defaults already applied). */
export interface EstimateContext {
  router: sor.TradeRouter;
  /** Resolve a Hydration asset id to its descriptor (symbol/decimals/address). */
  resolveAsset: (id: number) => XcSwapAsset;
  /** Resolve a destination 1Click asset id to its descriptor. */
  resolveDestination: (oneClickId: string) => XcSwapAsset;
  emitter: string;
  quoterUrl: string;
  relayMarginBps: number;
  slippageBps: number;
  xcmFee: bigint;
  oneClick: { baseUrl?: string; jwt?: string };
}

function amount(asset: XcSwapAsset, amount: bigint): AssetAmount {
  return new AssetAmount({
    key: asset.key,
    originSymbol: asset.symbol,
    symbol: asset.symbol,
    decimals: asset.decimals,
    amount,
  });
}

/** Apply a positive slippage pad (round up). */
function padUp(value: bigint, bps: number): bigint {
  return (value * (BPS + BigInt(bps))) / BPS;
}

/** Apply a negative slippage floor (round down). */
function padDown(value: bigint, bps: number): bigint {
  return (value * (BPS - BigInt(bps))) / BPS;
}

/**
 * Estimate a cross-chain swap: quote the on-Hydration fee-buy + sell legs, the
 * relay fee, and the 1Click ETH → destination quote, then assemble an
 * {@link XcSwapTrade} whose `buildCalls()` yields the executable EVM calls.
 *
 * Mirrors the off-chain math in `nirViaWtt.ts` and the on-chain semantics of
 * `IntentEmitter.swapAndBridge`.
 */
export async function estimateTrade(
  ctx: EstimateContext,
  params: XcSwapParams
): Promise<XcSwapTrade> {
  const slippageBps = params.slippageBps ?? ctx.slippageBps;
  const deadline = params.deadline ?? new Date(Date.now() + 30 * 60 * 1000);
  const destinationAssetId = params.destinationAsset ?? WRAP_NEAR_ASSET;

  const assetInId =
    typeof params.assetIn === 'number' ? params.assetIn : params.assetIn.id!;
  const assetIn = ctx.resolveAsset(assetInId);
  const destinationAsset = ctx.resolveDestination(destinationAssetId);

  const amountIn = BigInt(params.amountIn);
  const wethAsset: XcSwapAsset = {
    key: 'weth',
    symbol: 'WETH',
    decimals: WETH_DECIMALS,
    chain: 'hydration',
    id: WETH_ID,
  };

  // 0. Relay-fee ceiling — gas-based, independent of the swap.
  const maxRelayFee = await fetchMaxRelayFee({
    quoterUrl: ctx.quoterUrl,
    chain: 'ethereum',
    marginBps: ctx.relayMarginBps,
  });

  // 1. On-Hydration legs: buy the GLMR xcm fee, then sell the rest for WETH.
  let maxFeeIn = 0n;
  let feeSpent = 0n;
  if (assetInId !== GLMR_ID) {
    const feeBuy = await ctx.router.getBestBuy(assetInId, GLMR_ID, ctx.xcmFee);
    feeSpent = feeBuy.amountIn;
    maxFeeIn = padUp(feeBuy.amountIn, slippageBps);
  } else {
    // A is GLMR: the fee is withheld, not bought.
    feeSpent = ctx.xcmFee;
  }

  const sellAmount = amountIn - feeSpent;
  if (sellAmount <= 0n) {
    throw new Error(
      `amountIn ${amountIn} must exceed the xcm fee leg (${feeSpent})`
    );
  }

  let wethOut: bigint;
  let sell: sor.Trade | undefined;
  let priceImpactPct = 0;
  if (assetInId === WETH_ID) {
    // A is already WETH: nothing to sell, the remainder is bridged.
    wethOut = sellAmount;
  } else {
    sell = await ctx.router.getBestSell(assetInId, WETH_ID, sellAmount);
    wethOut = sell.amountOut;
    priceImpactPct = sell.priceImpactPct;
  }

  const minEthOut = padDown(wethOut, slippageBps);

  // 2. 1Click quote — sized to the net that lands after the relay fee.
  const swapAmount = wethOut - maxRelayFee;
  if (swapAmount <= 0n) {
    throw new Error(
      `bridged WETH ${wethOut} must exceed maxRelayFee ${maxRelayFee}`
    );
  }

  configureOneClick(ctx.oneClick);
  const { quote, correlationId } = await getOneClickQuote({
    amount: swapAmount,
    destinationAsset: destinationAssetId,
    recipient: params.recipient,
    refundTo: params.refundTo,
    slippageBps,
    deadline,
  });

  const depositAddress = quote.depositAddress;
  if (!depositAddress) {
    throw new Error('1Click did not return a deposit address');
  }
  const deadlineIso = deadline.toISOString();

  // 3. intentId — UI correlation hash threaded into the bridge payload.
  const intentId = keccak256(
    encodeAbiParameters(
      [
        { type: 'string' },
        { type: 'address' },
        { type: 'uint256' },
        { type: 'string' },
      ],
      [
        correlationId,
        depositAddress as `0x${string}`,
        BigInt(quote.amountIn),
        deadlineIso,
      ]
    )
  );

  return {
    amountIn: amount(assetIn, amountIn),
    maxFeeIn: amount(assetIn, maxFeeIn),
    wethOut: amount(wethAsset, wethOut),
    minEthOut: amount(wethAsset, minEthOut),
    maxRelayFee,
    depositAddress,
    amountOut: amount(destinationAsset, BigInt(quote.amountOut)),
    minAmountOut: amount(destinationAsset, BigInt(quote.minAmountOut)),
    intentId,
    correlationId,
    deadline: deadlineIso,
    timeEstimate: quote.timeEstimate,
    priceImpactPct,
    sell,
    buildCalls: () =>
      buildCalls({
        from: params.refundTo,
        assetInAddress: assetIn.address ?? toErc20(assetInId),
        emitter: ctx.emitter,
        assetIn: assetInId,
        amountIn,
        minEthOut,
        maxFeeIn,
        intentId,
        intentDepositAddress: depositAddress,
        maxRelayFee,
      }),
  };
}
