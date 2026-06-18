/** Hydration runtime asset id of bridged WETH (the asset the emitter bridges out). */
export const WETH_ID = 20;

/** Hydration runtime asset id of GLMR (used to pay the cross-chain XCM fee). */
export const GLMR_ID = 16;

/**
 * Default cross-chain XCM fee reserved in GLMR by the emitter.
 */
export const DEFAULT_XCM_FEE = 1_000_000_000_000_000_000n;

/** Default relay-fee quoter endpoint. */
export const DEFAULT_QUOTER_URL = 'https://quoter-api.play.hydration.cloud';

/** Default 1Click base URL. */
export const DEFAULT_ONE_CLICK_BASE_URL = 'https://1click.chaindefuser.com';

/** Default relay-fee margin, percent. */
export const DEFAULT_RELAY_MARGIN_PCT = 20;

/** Default slippage tolerance, percent (1 = 1%). */
export const DEFAULT_SLIPPAGE_PCT = 1;

/** Convert a percent (1 = 1%) to basis points (1% = 100 bps). */
export function pctToBps(pct: number): number {
  return Math.round(pct * 100);
}

/**
 * 1Click origin asset: native ETH on Ethereum (delivered to the deposit
 * address by the bridge/relayer).
 */
export const ONE_CLICK_ORIGIN_ASSET = 'nep141:eth.omft.near';

/** Destination asset: wrapped NEAR. */
export const WRAP_NEAR_ASSET = 'nep141:wrap.near';

/** Destination asset: ZEC (Zcash). */
export const ZEC_ASSET = 'nep141:zec.omft.near';
