import { erc20 } from '@galacticcouncil/common';
import type { Quote } from '@defuse-protocol/one-click-sdk-typescript';

import { keccak256, encodePacked, erc20Abi } from 'viem';

import { buildCalls } from './builder';
import type { SwapContext } from './types';
import { amount, padUp, padDown } from './utils';
import { fetchMaxRelayFee } from '../quote/relayFee';
import { getOneClickQuote } from '../quote/oneClick';
import { WETH_ID, GLMR_ID, MIN_WETH, pctToBps } from '../registry/consts';
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

  // Buy the GLMR xcm fee, then sell the rest for WETH.
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

  let wethOut = 0n;
  let priceImpactPct = 0;
  if (sellAmount > 0n) {
    if (assetInId !== WETH_ID) {
      const sell = await ctx.router.getBestSell(assetInId, WETH_ID, sellAmount);
      wethOut = sell.amountOut;
      priceImpactPct = sell.priceImpactPct;
    } else {
      // A is already WETH: nothing to sell, the remainder is bridged.
      wethOut = sellAmount;
    }
  }

  // Reference: full A → WETH with no fee carve-out (drives the fee breakdown).
  const idealSell =
    assetInId === WETH_ID
      ? undefined
      : await ctx.router.getBestSell(assetInId, WETH_ID, amountIn);
  const idealWeth = idealSell ? idealSell.amountOut : amountIn;

  /*
   * Concurrent HTTP/metadata:
   * - relay fee (gas-based)
   * - dry quote (priced at the full WETH; skipped when there's nothing to
   *   bridge, and its API errors are mapped to XcSwapError, not thrown)
   *
   * The fee is subtracted from the result afterwards via the quoted rate.
   */
  const [maxRelayFee, assetIn, wethAsset, destinationAsset, quoteRes] =
    await Promise.all([
      fetchMaxRelayFee({
        quoterUrl: ctx.quoterUrl,
        chain: 'ethereum',
        marginBps: pctToBps(ctx.relayMarginPct),
      }),
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

  const minEthOut = padDown(wethOut, slippageBps);

  // Net WETH that lands after the relay fee is skimmed on Ethereum.
  const swapAmount = wethOut > maxRelayFee ? wethOut - maxRelayFee : 0n;

  // Viability + quote errors — reported, not thrown (router-style).
  const errors: XcSwapError[] = [];
  if (minEthOut < MIN_WETH) {
    errors.push(XcSwapError.MinWethNotMet);
  }
  if (wethOut < 2n * maxRelayFee) {
    errors.push(XcSwapError.RelayFeeTooHigh);
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

  // Fee = value lost between the full input (idealWeth, no fees) and the WETH
  // that actually enters the swap (swapAmount): GLMR xcm fee + relay fee.
  const feeWeth = idealWeth > swapAmount ? idealWeth - swapAmount : 0n;
  const feeAmount = amount(wethAsset, feeWeth);
  const feePct =
    idealWeth > 0n ? Number((feeWeth * 10_000n) / idealWeth) / 100 : 0;

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

      const intentId = keccak256(
        encodePacked(
          ['address', 'uint256'],
          [depositAddress as `0x${string}`, amountIn]
        )
      );

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
        maxFeeIn,
        intentId,
        intentDepositAddress: depositAddress,
        maxRelayFee,
        approved: allowance >= amountIn,
      });

      return {
        calls,
        depositAddress,
        intentId,
        correlationId,
        deadline: deadlineIso,
      };
    },
  };
}
