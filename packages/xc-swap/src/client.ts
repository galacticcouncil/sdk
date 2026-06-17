import type { Asset as SdkAsset, sor } from '@galacticcouncil/sdk-next';

import {
  CHAINS,
  DESTINATION_ASSETS,
  ROUTES,
  getDestinationAsset,
  toOriginAsset,
  DEFAULT_QUOTER_URL,
  DEFAULT_RELAY_MARGIN_BPS,
  DEFAULT_SLIPPAGE_BPS,
  DEFAULT_XCM_FEE,
  HYDRATION_EVM_CHAIN_ID,
} from './registry';
import { estimateTrade, type EstimateContext } from './trade/estimate';
import type {
  XcSwapAsset,
  XcSwapChain,
  XcSwapOpts,
  XcSwapParams,
  XcSwapRoute,
  XcSwapTrade,
} from './types';

/**
 * Cross-chain swap client. Exposes the supported assets/chains/routes and
 * estimates a trade (Hydration asset → NEAR via NEAR Intent Routing),
 * returning an {@link XcSwapTrade} that can build the executable EVM calls.
 */
export class XcSwapClient {
  private readonly router: sor.TradeRouter;
  private readonly assets: Map<number, SdkAsset>;
  private readonly emitter: string;
  private readonly evmChainId: number;
  private readonly quoterUrl: string;
  private readonly relayMarginBps: number;
  private readonly slippageBps: number;
  private readonly xcmFee: bigint;
  private readonly oneClick: { baseUrl?: string; jwt?: string };

  constructor(opts: XcSwapOpts) {
    this.router = opts.router;
    this.assets = new Map(opts.assets.map((a) => [a.id, a]));
    this.emitter = opts.emitter;
    this.evmChainId = opts.evmChainId ?? HYDRATION_EVM_CHAIN_ID;
    this.quoterUrl = opts.quoterUrl ?? DEFAULT_QUOTER_URL;
    this.relayMarginBps = opts.relayMarginBps ?? DEFAULT_RELAY_MARGIN_BPS;
    this.slippageBps = opts.slippageBps ?? DEFAULT_SLIPPAGE_BPS;
    this.xcmFee = opts.xcmFee ?? DEFAULT_XCM_FEE;
    this.oneClick = opts.oneClick ?? {};
  }

  /** Supported origin assets (every Hydration asset routable to WETH/GLMR). */
  getOriginAssets(): XcSwapAsset[] {
    return Array.from(this.assets.values()).map(toOriginAsset);
  }

  /** Supported destination assets (phase 1: wrapped NEAR). */
  getDestinationAssets(): XcSwapAsset[] {
    return DESTINATION_ASSETS;
  }

  /** Supported chains. */
  getChains(): XcSwapChain[] {
    return CHAINS;
  }

  /** Supported route metadata. */
  getRoutes(): XcSwapRoute[] {
    return ROUTES;
  }

  /** Estimate a trade and produce a builder for the executable calls. */
  estimateTrade(params: XcSwapParams): Promise<XcSwapTrade> {
    return estimateTrade(this.context(), params);
  }

  private context(): EstimateContext {
    return {
      router: this.router,
      resolveAsset: (id) => this.resolveAsset(id),
      resolveDestination: (oneClickId) => this.resolveDestination(oneClickId),
      emitter: this.emitter,
      quoterUrl: this.quoterUrl,
      relayMarginBps: this.relayMarginBps,
      slippageBps: this.slippageBps,
      xcmFee: this.xcmFee,
      oneClick: this.oneClick,
    };
  }

  private resolveAsset(id: number): XcSwapAsset {
    const asset = this.assets.get(id);
    if (!asset) {
      throw new Error(`Unsupported origin asset id: ${id}`);
    }
    return toOriginAsset(asset);
  }

  private resolveDestination(oneClickId: string): XcSwapAsset {
    const asset = getDestinationAsset(oneClickId);
    if (!asset) {
      throw new Error(`Unsupported destination asset: ${oneClickId}`);
    }
    return asset;
  }
}
