import type { AssetAmount } from '@galacticcouncil/xc-core';
import type { EvmCall } from '@galacticcouncil/xc-sdk';
import type { SdkCtx } from '@galacticcouncil/sdk-next';

/** Platform an asset/chain lives on within an xc-swap route. */
export type XcSwapPlatform = 'hydration' | 'near' | 'zec';

/** A swap chain (origin or destination) exposed by the SDK. */
export interface XcSwapChain {
  key: string;
  name: string;
  platform: XcSwapPlatform;
}

/**
 * An asset exposed by the SDK.
 *
 * - Origin assets carry their Hydration runtime id and ERC-20 address;
 * - Destination assets carry their 1Click (NEAR / Defuse) asset id.
 */
export interface XcSwapAsset {
  key: string;
  symbol: string;
  decimals: number;
  chain: string;
  /** Hydration runtime asset id (origin assets only). */
  id?: number;
  /** ERC-20 precompile address on Hydration EVM (origin assets only). */
  address?: `0x${string}`;
  /** 1Click / Defuse asset identifier. */
  oneClickId?: string;
}

/** Metadata describing a supported origin → destination route. */
export interface XcSwapRoute {
  origin: XcSwapChain;
  destination: XcSwapChain;
  /** Destination asset (e.g. wrap.near, ZEC). */
  destinationAsset: XcSwapAsset;
  /** 1Click origin asset that the bridged value enters the swap as. */
  oneClickOriginAsset: string;
  /** True when the SDK can build an executable tx for this route. */
  executable: boolean;
}

/** Inputs to `swap`. */
export interface XcSwapParams {
  /** Origin asset A — Hydration runtime asset id (or an XcSwapAsset). */
  assetIn: number | XcSwapAsset;
  /** Amount of A to swap, in smallest units. */
  amountIn: bigint | string;
  /**  Destination 1Click asset id. */
  destinationAsset: string;
  /** Recipient on the destination chain. */
  recipient: string;
  /** Refund address on the Ethereum chain. */
  refundTo: string;
  /** Slippage tolerance, percent (1 = 1%). Default 1. */
  slippage?: number;
  /** Quote deadline as a Unix timestamp (ms). Default now + 30m. */
  deadline?: number;
}

/** Total swap fee */
export interface XcSwapFee {
  /** Fee valued in WETH (the bridged asset). */
  amount: AssetAmount;
  /** Fee in USD (from the 1Click quote's USD valuation). */
  usd: number;
  /** Fee as a percent of the input value. */
  pct: number;
}

/** Per-leg time estimates (seconds). */
export interface XcSwapTimeEstimate {
  /** 1Click swap leg (ETH → destination), as reported by the quote. */
  quote: number;
}

/**
 * An estimated cross-chain swap.
 */
export interface XcSwapTrade {
  /** Amount of A pulled from the caller. */
  amountIn: AssetAmount;
  /** Expected destination asset out (net, after fees). */
  amountOut: AssetAmount;
  /** Minimum destination asset out after slippage. */
  minAmountOut: AssetAmount;
  /** Effective exchange rate — destination units per 1 unit of A. */
  spotPrice: number;
  /** Total fee (GLMR xcm fee + relay fee). */
  fee: XcSwapFee;
  /** Per-leg time estimates (seconds). */
  timeEstimate: XcSwapTimeEstimate;
  /** Price impact of the on-Hydration sell leg, percent. */
  priceImpactPct: number;

  /**
   * Request a firm (non-dry) 1Click quote.
   */
  buildCall(): Promise<XcSwapRequest>;
}

/**
 * The executable cross-chain swap request, built from a firm 1Click quote.
 * Submit `calls` on Hydration EVM, then track settlement via `depositAddress`.
 */
export interface XcSwapRequest {
  /** Executable EVM calls on Hydration EVM: `[approve(A → emitter), swapAndBridge(...)]`. */
  calls: EvmCall[];
  /** Ethereum deposit address the bridged ETH lands at */
  depositAddress: string;
  /** UI correlation hash threaded into the bridge payload. */
  intentId: `0x${string}`;
  /** 1Click correlation id. */
  correlationId: string;
  /** Quote deadline (ISO). */
  deadline: string;
}

/** Construction options for the SDK client. */
export interface XcSwapOpts {
  sdk: SdkCtx;
  /** `IntentEmitter` proxy address on Hydration EVM. */
  emitter: string;
  /** Relay-fee quoter base URL. Default the play quoter. */
  quoterUrl?: string;
  /** Relay-fee margin, percent. Default 20. */
  relayMargin?: number;
  /** Default slippage tolerance, percent (1 = 1%). Default 1. */
  slippage?: number;
  /** XCM fee reserved in GLMR (smallest unit). Default 1 GLMR. */
  xcmFee?: bigint;
  /** 1Click asset ids exposed as destinations. */
  destinationAssets?: string[];
  /** 1Click API config. */
  oneClick?: { baseUrl?: string; jwt?: string };
}
