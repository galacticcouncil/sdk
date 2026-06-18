import { AssetAmount } from '@galacticcouncil/xc-core';
import { erc20 } from '@galacticcouncil/common';
import type { evm, sor } from '@galacticcouncil/sdk-next';

import { keccak256, encodePacked, erc20Abi } from 'viem';

import { buildCalls } from './build';
import { fetchMaxRelayFee } from '../quote/relayFee';
import { configureOneClick, getOneClickQuote } from '../quote/oneClick';
import { WETH_ID, GLMR_ID, pctToBps } from '../registry/consts';
import type {
  XcSwapAsset,
  XcSwapParams,
  XcSwapRequest,
  XcSwapTrade,
} from '../types';

const BPS = 10_000n;

/** Resolved configuration the swap orchestration needs (defaults applied). */
export interface SwapContext {
  router: sor.TradeRouter;
  /** EVM client (sdk-next) used to read the emitter allowance over A. */
  evm: evm.EvmClient;
  /** Resolve a Hydration asset id to its descriptor (symbol/decimals/address). */
  resolveAsset: (id: number) => Promise<XcSwapAsset>;
  /** Resolve a destination 1Click asset id to its descriptor (from the registry). */
  resolveDestination: (oneClickId: string) => Promise<XcSwapAsset>;
  emitter: string;
  quoterUrl: string;
  /** Relay-fee margin, percent. */
  relayMarginPct: number;
  /** Default slippage tolerance, percent (1 = 1%). */
  slippagePct: number;
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
  const assetIn = await ctx.resolveAsset(assetInId);
  const destinationAsset = await ctx.resolveDestination(destinationAssetId);

  const amountIn = BigInt(params.amountIn);
  // WETH metadata (symbol/decimals) sourced from the sdk-next asset registry.
  const wethAsset = await ctx.resolveAsset(WETH_ID);

  // 0. Relay-fee ceiling — gas-based, independent of the swap.
  const maxRelayFee = await fetchMaxRelayFee({
    quoterUrl: ctx.quoterUrl,
    chain: 'ethereum',
    marginBps: pctToBps(ctx.relayMarginPct),
  });

  // 1. On-Hydration legs: buy the GLMR xcm fee, then sell the rest for WETH.
  let maxFeeIn = 0n;
  let feeSpent = 0n;
  let feeBuy: sor.Trade | undefined;
  if (assetInId !== GLMR_ID) {
    feeBuy = await ctx.router.getBestBuy(assetInId, GLMR_ID, ctx.xcmFee);
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

  // Underlying on-Hydration trades, in execution order (fee-buy then sell).
  const trades = [feeBuy, sell].filter((t): t is sor.Trade => t !== undefined);

  // 2. 1Click quote — sized to the net that lands after the relay fee.
  const swapAmount = wethOut - maxRelayFee;
  if (swapAmount <= 0n) {
    throw new Error(
      `bridged WETH ${wethOut} must exceed maxRelayFee ${maxRelayFee}`
    );
  }

  const quoteParams = {
    amount: swapAmount,
    destinationAsset: destinationAssetId,
    recipient: params.recipient,
    refundTo: params.refundTo,
    slippageBps,
    deadline,
  };

  configureOneClick(ctx.oneClick);
  // Estimate with a dry quote (no deposit address).
  const { quote } = await getOneClickQuote({ ...quoteParams, dry: true });

  const assetInAddress =
    assetIn.address ?? (erc20.ERC20.fromAssetId(assetInId) as `0x${string}`);
  const deadlineIso = new Date(deadline).toISOString();

  return {
    amountIn: amount(assetIn, amountIn),
    maxFeeIn: amount(assetIn, maxFeeIn),
    wethOut: amount(wethAsset, wethOut),
    minEthOut: amount(wethAsset, minEthOut),
    maxRelayFee,
    amountOut: amount(destinationAsset, BigInt(quote.amountOut)),
    minAmountOut: amount(destinationAsset, BigInt(quote.minAmountOut)),
    swapTimeEstimate: quote.timeEstimate,
    priceImpactPct,
    trades,
    buildCall: async (): Promise<XcSwapRequest> => {
      // Firm quote — yields the Ethereum deposit address.
      const { quote: firm, correlationId } = await getOneClickQuote({
        ...quoteParams,
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
