import { pad, toHex } from 'viem';

/**
 * Hydration-side constants mirrored from the WHM `IntentEmitter` contracts
 * (contracts/src/utils/hydration/HydrationConsts.sol). These are the
 * **Hydration runtime asset ids** the on-chain `swapAndBridge` swap legs key
 * on — the same id space `sdk-next`'s `TradeRouter` uses.
 *
 * NOTE: verified against `HydrationConsts.sol`; confirm against the live
 * runtime before relying on these for a new deployment.
 */

/** Hydration runtime asset id of bridged WETH (the asset the emitter bridges out). */
export const WETH_ID = 20;

/** Hydration runtime asset id of GLMR (used to pay the cross-chain XCM fee). */
export const GLMR_ID = 16;

/** WETH / GLMR are 18-decimal on Hydration. */
export const WETH_DECIMALS = 18;
export const GLMR_DECIMALS = 18;

/** Hydration EVM (Frontier) chain id. */
export const HYDRATION_EVM_CHAIN_ID = 222222;

/** Wormhole chain id of Ethereum (the bridge destination). */
export const ETHEREUM_WORMHOLE_ID = 2;

/**
 * Default cross-chain XCM fee reserved in GLMR by the emitter
 * (`IntentEmitter._initEmitter`: 1 GLMR). Used to size the fee-buy leg of the
 * estimate. Prefer reading `emitter.xcmFee()` on-chain when available.
 */
export const DEFAULT_XCM_FEE = 1_000_000_000_000_000_000n;

/** Default relay-fee quoter endpoint (see nirViaWtt.ts). */
export const DEFAULT_QUOTER_URL = 'https://quoter-api.play.hydration.cloud';

/** Default relay-fee margin (basis points) — matches nirViaWtt MAX_FEE_MARGIN_BPS. */
export const DEFAULT_RELAY_MARGIN_BPS = 2000;

/** Default 1Click base URL. */
export const DEFAULT_ONE_CLICK_BASE_URL = 'https://1click.chaindefuser.com';

/** Default slippage tolerance (basis points). */
export const DEFAULT_SLIPPAGE_BPS = 100;

/**
 * 1Click origin asset: native ETH on Ethereum (delivered to the deposit
 * address by the bridge/relayer). This is what the swapped WETH becomes on
 * Ethereum and what enters the ETH → destination quote.
 */
export const ONE_CLICK_ORIGIN_ASSET = 'nep141:eth.omft.near';

/** Phase-1 destination asset: wrapped NEAR. */
export const WRAP_NEAR_ASSET = 'nep141:wrap.near';

/**
 * Map a Hydration runtime asset id to its ERC-20 precompile address, matching
 * `HydrationConsts.toErc20`: `address((uint160(1) << 32) | assetId)`.
 */
export function toErc20(assetId: number): `0x${string}` {
  const address = (1n << 32n) | BigInt(assetId);
  return pad(toHex(address), { size: 20 });
}
