import type { AssetAmount } from '@galacticcouncil/xc-core';
import type { EvmCall } from '@galacticcouncil/xc-sdk';
import type { sor, SdkCtx } from '@galacticcouncil/sdk-next';

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

/**
 * An estimated cross-chain swap.
 */
export interface XcSwapTrade {
  // ─── (Hydration) legs ───

  /** Amount of A pulled from the caller. */
  amountIn: AssetAmount;
  /** Upper bound of A spent buying the GLMR xcm fee (slippage-bounded; 0 when A is GLMR). */
  maxFeeIn: AssetAmount;
  /** Expected WETH bridged out. */
  wethOut: AssetAmount;
  /** Slippage floor on the bridged WETH, passed to `swapAndBridge` as `minEthOut`. */
  minEthOut: AssetAmount;
  /** Relay fee ceiling carried in the bridge payload (from the quoter). */
  maxRelayFee: bigint;

  // ─── 1Click leg (estimated) ───

  /** Expected destination asset out. */
  amountOut: AssetAmount;
  /** Minimum destination asset out after slippage. */
  minAmountOut: AssetAmount;
  /** Estimated time of the 1Click swap */
  swapTimeEstimate: number;
  /** Price impact of the on-Hydration sell leg, percent. */
  priceImpactPct: number;

  /** The underlying on-Hydration trades (fee-buy A → GLMR, sell A → WETH). */
  trades: sor.Trade[];

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
