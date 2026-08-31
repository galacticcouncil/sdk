import { erc20 } from '@galacticcouncil/common';
import type { Quote } from '@defuse-protocol/one-click-sdk-typescript';

import { erc20Abi } from 'viem';

import { buildCalls } from './builder';
import type { SwapContext } from './types';
import { amount, padDown, trim } from './utils';
import { fetchMaxRelayFee } from '../quote/relayFee';
import { getOneClickQuote } from '../quote/oneClick';
import { WETH_ID, MIN_WETH, TRIM_UNIT, pctToBps } from '../registry/consts';
import {
  XcSwapError,
  type XcSwapParams,
  type XcSwapRequest,
  type XcSwapTrade,
} from '../types';

const { ERC20 } = erc20;

type QuoteResult = { quote?: Quote; error?: XcSwapError };

/** Map a 1Click quote API error to a custom {@link XcSwapError}. */
function mapQuoteError(error: unknown): XcSwapError {
  const body = (error as { body?: { message?: string } } | null)?.body;
  const message = (
    body?.message ??
    (error as Error | null)?.message ??
    ''
  ).toLowerCase();
  if (message.includes('recipient')) return XcSwapError.RecipientInvalid;
  if (message.includes('too low')) return XcSwapError.AmountTooLow;
  return XcSwapError.QuoteFailed;
}

/**
 * Estimate a cross-chain swap
 */
export async function swap(
  ctx: SwapContext,
  params: XcSwapParams
): Promise<XcSwapTrade> {
  const slippageBps = pctToBps(params.slippage ?? ctx.slippagePct);
  const deadline = params.deadline ?? Date.now() + 30 * 60 * 1000;
  const destinationAssetId = params.destinationAsset;

  const assetInId =
    typeof params.assetIn === 'number' ? params.assetIn : params.assetIn.id!;
  const amountIn = BigInt(params.amountIn);

  // The whole input is sold: the rail's cost is charged against the swap
  // output, so there is nothing to carve out of A up front.
  let wethOut = 0n;
  let priceImpactPct = 0;
  if (assetInId !== WETH_ID) {
    const sell = await ctx.router.getBestSell(assetInId, WETH_ID, amountIn);
    wethOut = sell.amountOut;
    priceImpactPct = sell.priceImpactPct;
  } else {
    // A is already WETH: the emitter skips the swap and settles it as-is.
    wethOut = amountIn;
  }

  /*
   * Concurrent HTTP/chain reads:
   * - relay fee (gas-based)
   * - rail state (delivery price, pause, outbound capacity)
   * - dry quote (priced at the full WETH; skipped when there's nothing to
   *   bridge, and its API errors are mapped to XcSwapError, not thrown)
   *
   * Both fees are subtracted from the result afterwards via the quoted rate.
   */
  const [maxRelayFee, rail, assetIn, wethAsset, destinationAsset, quoteRes] =
    await Promise.all([
      fetchMaxRelayFee({
        quoterUrl: ctx.quoterUrl,
        chain: 'ethereum',
        marginBps: pctToBps(ctx.relayMarginPct),
      }),
      ctx.rail(),
      ctx.resolveAsset(assetInId),
      ctx.resolveAsset(WETH_ID),
      ctx.resolveDestination(destinationAssetId),
      wethOut > 0n
        ? getOneClickQuote({
            amount: wethOut,
            destinationAsset: destinationAssetId,
            recipient: params.recipient,
            refundTo: params.refundTo,
            slippageBps,
            deadline,
            dry: true,
          }).then(
            (res): QuoteResult => ({ quote: res.quote }),
            (error): QuoteResult => ({ error: mapQuoteError(error) })
          )
        : Promise.resolve<QuoteResult>({}),
    ]);
  const quote = quoteRes.quote;

  // What the settlement carries: the swap output less the rail's delivery
  // price, quantized to the rail's precision.
  const bridged =
    wethOut > rail.cost ? trim(wethOut - rail.cost, TRIM_UNIT) : 0n;

  // Floor on the settled amount. The emitter trims it and raises the router's
  // own floor by the cost, so it is expressed against what actually bridges.
  const minEthOut = trim(padDown(bridged, slippageBps), TRIM_UNIT);

  // Net WETH that lands after the relay fee is skimmed on Ethereum.
  const swapAmount = bridged > maxRelayFee ? bridged - maxRelayFee : 0n;

  // Viability + quote errors — reported, not thrown (router-style).
  const errors: XcSwapError[] = [];
  if (rail.paused) {
    errors.push(XcSwapError.RailPaused);
  }
  if (wethOut <= rail.cost) {
    errors.push(XcSwapError.BelowDeliveryPrice);
  } else if (bridged === 0n) {
    errors.push(XcSwapError.BelowTrimUnit);
  }
  if (bridged > rail.capacity) {
    errors.push(XcSwapError.RailRateLimited);
  }
  if (maxRelayFee >= bridged) {
    errors.push(XcSwapError.RelayFeeExceedsAmount);
  } else if (bridged < 2n * maxRelayFee) {
    errors.push(XcSwapError.RelayFeeTooHigh);
  }
  if (minEthOut < MIN_WETH) {
    errors.push(XcSwapError.MinWethNotMet);
  }
  if (quoteRes.error) {
    errors.push(quoteRes.error);
  }

  // The dry quote priced the full wethOut; scale its outputs to the net that
  // actually lands (swapAmount) by the quoted rate — linear in the input.
  const scaleToNet = (value: bigint): bigint =>
    wethOut > 0n ? (value * swapAmount) / wethOut : 0n;

  const amountInAmount = amount(assetIn, amountIn);
  const amountOutAmount = amount(
    destinationAsset,
    quote ? scaleToNet(BigInt(quote.amountOut)) : 0n
  );
  const minAmountOutAmount = amount(
    destinationAsset,
    quote ? scaleToNet(BigInt(quote.minAmountOut)) : 0n
  );

  // Fee = value lost between the full swap output and the WETH that actually
  // enters the 1Click swap: the rail's cost, quantization dust, and the relay
  // fee ceiling.
  const feeWeth = wethOut > swapAmount ? wethOut - swapAmount : 0n;
  const feeAmount = amount(wethAsset, feeWeth);
  const feePct =
    wethOut > 0n ? Number((feeWeth * 10_000n) / wethOut) / 100 : 0;

  // USD per WETH from the (full-WETH) quote valuation; rate = dest per 1 A.
  const wethOutDecimal = Number(amount(wethAsset, wethOut).toDecimal());
  const usdPerWeth =
    wethOutDecimal > 0 && quote?.amountInUsd
      ? parseFloat(quote.amountInUsd) / wethOutDecimal
      : 0;
  const feeUsd = Number(feeAmount.toDecimal()) * usdPerWeth;
  const amountInDecimal = Number(amountInAmount.toDecimal());
  const spotPrice =
    amountInDecimal > 0
      ? Number(amountOutAmount.toDecimal()) / amountInDecimal
      : 0;

  const assetInAddress =
    assetIn.address ?? (ERC20.fromAssetId(assetInId) as `0x${string}`);
  const deadlineIso = new Date(deadline).toISOString();

  return {
    amountIn: amountInAmount,
    amountOut: amountOutAmount,
    minAmountOut: minAmountOutAmount,
    spotPrice,
    fee: { amount: feeAmount, usd: feeUsd, pct: feePct },
    settlement: {
      wethOut: amount(wethAsset, wethOut),
      bridged: amount(wethAsset, bridged),
      amount: amount(wethAsset, swapAmount),
      minEthOut: amount(wethAsset, minEthOut),
      maxRelayFee: amount(wethAsset, maxRelayFee),
    },
    timeEstimate: { quote: quote?.timeEstimate ?? 0 },
    priceImpactPct,
    errors,
    buildCall: async (): Promise<XcSwapRequest> => {
      if (errors.length) {
        throw new Error(`Cannot build a non-viable swap: ${errors.join(', ')}`);
      }
      // Firm quote — sized to the exact net amount; yields the deposit address.
      const { quote: firm, correlationId } = await getOneClickQuote({
        amount: swapAmount,
        destinationAsset: destinationAssetId,
        recipient: params.recipient,
        refundTo: params.refundTo,
        slippageBps,
        deadline,
        dry: false,
      });
      const depositAddress = firm.depositAddress;
      if (!depositAddress) {
        throw new Error('1Click did not return a deposit address');
      }

      // Skip the approve when the emitter already has sufficient allowance.
      const allowance = (await ctx.evm.getProvider().readContract({
        abi: erc20Abi,
        address: assetInAddress,
        functionName: 'allowance',
        args: [params.refundTo as `0x${string}`, ctx.emitter as `0x${string}`],
      })) as bigint;

      const calls = buildCalls({
        from: params.refundTo,
        assetInAddress,
        emitter: ctx.emitter,
        assetIn: assetInId,
        amountIn,
        minEthOut,
        depositAddress,
        maxRelayFee,
        approved: allowance >= amountIn,
      });

      return {
        calls,
        depositAddress,
        correlationId,
        deadline: deadlineIso,
      };
    },
  };
}
