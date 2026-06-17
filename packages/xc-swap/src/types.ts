import type { AssetAmount } from '@galacticcouncil/xc-core';
import type { EvmCall } from '@galacticcouncil/xc-sdk';
import type { sor, Asset as SdkAsset } from '@galacticcouncil/sdk-next';

/** Platform an asset/chain lives on within an xc-swap route. */
export type XcSwapPlatform = 'hydration-evm' | 'near';

/** A swap chain (origin or destination) exposed by the SDK. */
export interface XcSwapChain {
  key: string;
  name: string;
  platform: XcSwapPlatform;
  /** EVM chain id, when the chain has an EVM execution layer. */
  evmChainId?: number;
}

/**
 * An asset exposed by the SDK. Origin assets carry their Hydration runtime id
 * and ERC-20 precompile address; destination assets carry their 1Click
 * (NEAR / Defuse) asset id.
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
  /** 1Click / Defuse asset identifier (destination assets, and the bridge origin). */
  oneClickId?: string;
}

/** Metadata describing a supported origin → destination route. */
export interface XcSwapRoute {
  origin: XcSwapChain;
  destination: XcSwapChain;
  /** Destination asset (phase 1: wrap.near). */
  destinationAsset: XcSwapAsset;
  /** 1Click origin asset that the bridged value enters the swap as. */
  oneClickOriginAsset: string;
  /** True when the SDK can build an executable tx for this route. */
  executable: boolean;
}

/** Inputs to `estimateTrade`. */
export interface XcSwapParams {
  /** Origin asset A — Hydration runtime asset id (or an XcSwapAsset). */
  assetIn: number | XcSwapAsset;
  /** Amount of A to swap, in smallest units. */
  amountIn: bigint | string;
  /** Destination 1Click asset id. Default `nep141:wrap.near`. */
  destinationAsset?: string;
  /** Recipient on the destination chain (e.g. a NEAR account id). */
  recipient: string;
  /**
   * Refund address on the origin (Hydration EVM) chain. Also used as the
   * `from` of the built calls. Defaults to `recipient` is NOT assumed — this
   * is an EVM address and must be supplied.
   */
  refundTo: string;
  /** Slippage tolerance in basis points. Default 100 (1%). */
  slippageBps?: number;
  /** Quote deadline. Default now + 30m. */
  deadline?: Date;
}

/** A fully estimated cross-chain swap, ready to be turned into calls. */
export interface XcSwapTrade {
  // ─── origin (Hydration) legs ───
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

  // ─── 1Click leg ───
  /** Ethereum deposit address the bridged ETH must land at (`intentDepositAddress`). */
  depositAddress: string;
  /** Expected destination asset out. */
  amountOut: AssetAmount;
  /** Minimum destination asset out after slippage. */
  minAmountOut: AssetAmount;
  /** UI correlation hash threaded into the bridge payload. */
  intentId: `0x${string}`;
  /** 1Click correlation id. */
  correlationId: string;
  /** Quote deadline (ISO). */
  deadline: string;
  /** Estimated end-to-end execution time, seconds. */
  timeEstimate: number;
  /** Price impact of the on-Hydration sell leg, percent. */
  priceImpactPct: number;

  /** The underlying on-Hydration sell trade (A → WETH), when a sell occurred. */
  sell?: sor.Trade;

  /**
   * Build the executable EVM calls on Hydration EVM:
   * `[approve(A → emitter), swapAndBridge(...)]`.
   */
  buildCalls(): EvmCall[];
}

/** Construction options for the SDK client. */
export interface XcSwapOpts {
  /** sdk-next trade router (caller owns the papi/EVM connection lifecycle). */
  router: sor.TradeRouter;
  /** Supported Hydration assets (e.g. from `client.AssetClient.getSupported()`). */
  assets: SdkAsset[];
  /** `IntentEmitter` proxy address on Hydration EVM. */
  emitter: string;
  /** Hydration EVM chain id. Default 222222. */
  evmChainId?: number;
  /** Relay-fee quoter base URL. Default the play quoter. */
  quoterUrl?: string;
  /** Relay-fee margin in basis points. Default 2000. */
  relayMarginBps?: number;
  /** Default slippage tolerance in basis points. Default 100. */
  slippageBps?: number;
  /** XCM fee reserved in GLMR (smallest unit). Default 1 GLMR. */
  xcmFee?: bigint;
  /** 1Click API config. */
  oneClick?: { baseUrl?: string; jwt?: string };
}
