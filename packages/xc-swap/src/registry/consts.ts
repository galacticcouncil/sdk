/** Hydration runtime asset id of bridged WETH (the asset the emitter bridges out). */
export const WETH_ID = 20;

/** Wormhole chain id of the settlement destination. */
export const ETHEREUM_WORMHOLE_ID = 2;

/**
 * Rail precision, mirroring `IntentEmitter.TRIM_UNIT`.
 *
 * - NTT trims to 8 decimals, WETH carries 18
 * - The remainder accrues in the emitter as sweepable dust
 */
export const TRIM_UNIT = 10_000_000_000n;

/**
 * Transceiver instructions for a delivery-price quote.
 *
 * - Zero-count prefix; empty bytes reverts `LengthMismatch(0,1)`
 */
export const NO_TRANSCEIVER_INSTRUCTIONS = '0x00';

/** Minimum bridged WETH for a viable swap (0.0004 WETH, 18 dp). */
export const MIN_WETH = 400_000_000_000_000n;

/** Default relay-fee quoter endpoint. */
export const DEFAULT_QUOTER_URL = 'https://quoter-intent.play.hydration.cloud';

/** Default 1Click base URL. */
export const DEFAULT_ONE_CLICK_BASE_URL = 'https://1click.chaindefuser.com';

/** Default relay-fee margin, percent. */
export const DEFAULT_RELAY_MARGIN_PCT = 20;

/** Default slippage tolerance, percent (1 = 1%). */
export const DEFAULT_SLIPPAGE_PCT = 1;

/**
 * How long the emitter's rail state stays cached, milliseconds.
 *
 * - Delivery price and message fee are governance parameters
 * - Pause state and outbound capacity move with rail activity
 */
export const DEFAULT_RAIL_TTL_MS = 30_000;

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
