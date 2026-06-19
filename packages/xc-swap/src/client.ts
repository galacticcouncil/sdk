import type { Asset as SdkAsset, SdkCtx } from '@galacticcouncil/sdk-next';
import type { TokenResponse } from '@defuse-protocol/one-click-sdk-typescript';

import {
  CHAINS,
  DEFAULT_DESTINATION_ASSET_IDS,
  buildRoutes,
  tokenToAsset,
  toOriginAsset,
  DEFAULT_QUOTER_URL,
  DEFAULT_RELAY_MARGIN_PCT,
  DEFAULT_SLIPPAGE_PCT,
  DEFAULT_XCM_FEE,
} from './registry';
import { configureOneClick, fetchOneClickTokens } from './quote/oneClick';
import { swap } from './trade/swap';
import type { SwapContext } from './trade/types';
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
 * estimates a trade via NEAR Intent Routing.
 */
export class XcSwapClient {
  private readonly sdk: SdkCtx;
  private readonly emitter: string;
  private readonly quoterUrl: string;
  private readonly relayMargin: number;
  private readonly slippage: number;
  private readonly xcmFee: bigint;
  private readonly oneClick: { baseUrl?: string; jwt?: string };
  /** 1Click asset ids exposed as destinations. */
  private readonly destinationAssetIds: string[];

  private tokens?: Promise<TokenResponse[]>;
  private assets?: Promise<Map<number, SdkAsset>>;

  constructor(opts: XcSwapOpts) {
    this.sdk = opts.sdk;
    this.emitter = opts.emitter;
    this.quoterUrl = opts.quoterUrl ?? DEFAULT_QUOTER_URL;
    this.relayMargin = opts.relayMargin ?? DEFAULT_RELAY_MARGIN_PCT;
    this.slippage = opts.slippage ?? DEFAULT_SLIPPAGE_PCT;
    this.xcmFee = opts.xcmFee ?? DEFAULT_XCM_FEE;
    this.oneClick = opts.oneClick ?? {};
    this.destinationAssetIds =
      opts.destinationAssets ?? DEFAULT_DESTINATION_ASSET_IDS;
    configureOneClick(this.oneClick);
  }

  /** Supported chains. */
  getChains(): XcSwapChain[] {
    return CHAINS;
  }

  /** Supported origin assets */
  async getOriginAssets(): Promise<XcSwapAsset[]> {
    const assets = await this.getAssets();
    return Array.from(assets.values()).map(toOriginAsset);
  }

  /**
   * Supported destination assets, sourced from the 1Click token registry
   * (`GET /v0/tokens`) and scoped to the configured allowlist.
   */
  async getDestinationAssets(): Promise<XcSwapAsset[]> {
    const tokens = await this.getTokens();
    const allow = new Set(this.destinationAssetIds);
    return tokens.filter((t) => allow.has(t.assetId)).map(tokenToAsset);
  }

  /** Supported route metadata. */
  async getRoutes(): Promise<XcSwapRoute[]> {
    return buildRoutes(await this.getDestinationAssets());
  }

  /** Estimate a swap and produce a builder for the executable request. */
  async swap(params: XcSwapParams): Promise<XcSwapTrade> {
    return swap(this.context(), params);
  }

  private context(): SwapContext {
    return {
      router: this.sdk.api.router,
      evm: this.sdk.client.evm,
      resolveAsset: (id) => this.resolveAsset(id),
      resolveDestination: (oneClickId) => this.resolveDestination(oneClickId),
      emitter: this.emitter,
      quoterUrl: this.quoterUrl,
      relayMarginPct: this.relayMargin,
      slippagePct: this.slippage,
      xcmFee: this.xcmFee,
    };
  }

  /** Memoized Hydration asset registry (runtime ids), from sdk-next. */
  private getAssets(): Promise<Map<number, SdkAsset>> {
    if (!this.assets) {
      this.assets = this.sdk.client.asset
        .getSupported()
        .then((list) => new Map(list.map((a) => [a.id, a])));
    }
    return this.assets;
  }

  private getTokens(): Promise<TokenResponse[]> {
    if (!this.tokens) {
      this.tokens = fetchOneClickTokens();
    }
    return this.tokens;
  }

  private async resolveAsset(id: number): Promise<XcSwapAsset> {
    const assets = await this.getAssets();
    const asset = assets.get(id);
    if (!asset) {
      throw new Error(`Unsupported origin asset id: ${id}`);
    }
    return toOriginAsset(asset);
  }

  private async resolveDestination(oneClickId: string): Promise<XcSwapAsset> {
    if (!this.destinationAssetIds.includes(oneClickId)) {
      throw new Error(`Unsupported destination asset: ${oneClickId}`);
    }
    const tokens = await this.getTokens();
    const token = tokens.find((t) => t.assetId === oneClickId);
    if (!token) {
      throw new Error(
        `Destination asset not in 1Click registry: ${oneClickId}`
      );
    }
    return tokenToAsset(token);
  }
}
