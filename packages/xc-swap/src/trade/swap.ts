import { erc20 } from '@galacticcouncil/common';

import { keccak256, encodePacked, erc20Abi } from 'viem';

import { buildCalls } from './builder';
import type { SwapContext } from './types';
import { amount, padUp, padDown } from './utils';
import { fetchMaxRelayFee } from '../quote/relayFee';
import { getOneClickQuote } from '../quote/oneClick';
import { WETH_ID, GLMR_ID, pctToBps } from '../registry/consts';
import type { XcSwapParams, XcSwapRequest, XcSwapTrade } from '../types';

const { ERC20 } = erc20;

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
  if (sellAmount <= 0n) {
    throw new Error(
      `AmountIn ${amountIn} must exceed the xcm fee leg (${feeSpent})`
    );
  }

  let wethOut: bigint;
  let priceImpactPct = 0;
  if (assetInId !== WETH_ID) {
    const sell = await ctx.router.getBestSell(assetInId, WETH_ID, sellAmount);
    wethOut = sell.amountOut;
    priceImpactPct = sell.priceImpactPct;
  } else {
    // A is already WETH: nothing to sell, the remainder is bridged.
    wethOut = sellAmount;
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
   * - dry quote
   *
   * The fee is subtracted from the result afterwards via the quoted rate.
   */
  const [maxRelayFee, assetIn, wethAsset, destinationAsset, { quote }] =
    await Promise.all([
      fetchMaxRelayFee({
        quoterUrl: ctx.quoterUrl,
        chain: 'ethereum',
        marginBps: pctToBps(ctx.relayMarginPct),
      }),
      ctx.resolveAsset(assetInId),
      ctx.resolveAsset(WETH_ID),
      ctx.resolveDestination(destinationAssetId),
      getOneClickQuote({
        amount: wethOut,
        destinationAsset: destinationAssetId,
        recipient: params.recipient,
        refundTo: params.refundTo,
        slippageBps,
        deadline,
        dry: true,
      }),
    ]);

  const minEthOut = padDown(wethOut, slippageBps);

  // Net WETH that lands after the relay fee is skimmed on Ethereum.
  const swapAmount = wethOut - maxRelayFee;
  if (swapAmount <= 0n) {
    throw new Error(
      `Bridged WETH ${wethOut} must exceed maxRelayFee ${maxRelayFee}`
    );
  }

  const scaleToNet = (value: bigint): bigint => (value * swapAmount) / wethOut;

  const amountInAmount = amount(assetIn, amountIn);
  const amountOutAmount = amount(
    destinationAsset,
    scaleToNet(BigInt(quote.amountOut))
  );
  const minAmountOutAmount = amount(
    destinationAsset,
    scaleToNet(BigInt(quote.minAmountOut))
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
    wethOutDecimal > 0 && quote.amountInUsd
      ? parseFloat(quote.amountInUsd) / wethOutDecimal
      : 0;
  const feeUsd = Number(feeAmount.toDecimal()) * usdPerWeth;
  const spotPrice =
    Number(amountOutAmount.toDecimal()) / Number(amountInAmount.toDecimal());

  const assetInAddress =
    assetIn.address ?? (ERC20.fromAssetId(assetInId) as `0x${string}`);
  const deadlineIso = new Date(deadline).toISOString();

  return {
    amountIn: amountInAmount,
    amountOut: amountOutAmount,
    minAmountOut: minAmountOutAmount,
    spotPrice,
    fee: { amount: feeAmount, usd: feeUsd, pct: feePct },
    timeEstimate: { quote: quote.timeEstimate },
    priceImpactPct,
    buildCall: async (): Promise<XcSwapRequest> => {
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
