/** Intents v2 dispatcher on Hydration EVM (mainnet). */
export const DEFAULT_DISPATCHER = '0x2c967d7e00a18c1c926fd77de733a27c3fdb3f2b';

/** Intents router on NEAR — the predecessor every deposit account derives for. */
export const DEFAULT_ROUTER = 'intents-router.hydration-whm.near';

/** NEAR MPC signer deriving the deposit accounts. */
export const DEFAULT_MPC_SIGNER = 'v1.signer';

/** NEAR RPC endpoint. */
export const DEFAULT_NEAR_RPC = 'https://free.rpc.fastnear.com';

/** Quoter serving the relay fee ceiling. */
export const DEFAULT_QUOTER_URL = 'https://quoter-intent.play.hydration.cloud';

/** Intents v2 scan API. */
export const DEFAULT_SCAN_URL = 'https://scan.play.hydration.cloud/api/v2';

/** WETH runtime asset id: every order sells into it. */
export const WETH_ASSET_ID = 20;

/** WETH ERC20 precompile — what `dispatch` pulls. */
export const WETH_ERC20 = '0x0000000000000000000000000000000100000014' as const;

/** `v1.signer`'s Ed25519 domain. */
export const MPC_DOMAIN_ED25519 = 1;

/** Ethereum's Wormhole chain id — where every order bridges. */
export const ETHEREUM_WORMHOLE_ID = 2;

/** NTT trim unit: the rail bridges whole multiples of this, in wei. */
export const TRIM_UNIT = 10n ** 10n;

/** Router's fill tolerance: a fill may sell this much less than `A` holds. */
export const FILL_TOLERANCE_BPS = 100n;

/** ICE limit on a forward's calldata. */
export const MAX_FORWARD_DATA = 512;

/** Terms encoding version: limit swap. */
export const TERMS_VERSION = 1;

/** Basis points in one. */
export const BPS = 10_000n;

/** Hydration block time used for TWAP deadlines, ms. */
export const BLOCK_TIME_MS = 2_200;

/** Default slippage the router may quote under, bps. */
export const DEFAULT_MAX_SLIPPAGE_BPS = 300;

/** Default hard floor under the dispatcher's live rate, bps. */
export const DEFAULT_FLOOR_BPS = 2000;

/** Relay ceiling headroom over the quoter's estimate, bps. */
export const DEFAULT_RELAY_MARGIN_BPS = 2000;

/** Default ICE swap lifetime, minutes. */
export const DEFAULT_SWAP_DEADLINE_MIN = 60;

/** Swap terms outlive the ICE intent by this, seconds. */
export const SWAP_TERMS_GRACE_S = 3600;

/** TWAP terms outlive the last tranche by this, seconds. */
export const TWAP_TERMS_GRACE_S = 7200;

/** Least TWAP period ICE accepts, blocks. */
export const MIN_TWAP_PERIOD = 15;

/** Default TWAP period, blocks (~5 min). */
export const DEFAULT_TWAP_PERIOD = 150;

/** `maxFillMultiplier` bounds. */
export const MIN_FILL_MULTIPLIER = 2;
export const MAX_FILL_MULTIPLIER = 100;

/** Longest close countdown the dispatcher allows, seconds. */
export const MAX_CLOSE_DELAY = 86_400;

/** Default close countdown, seconds — in-flight orders still fill. */
export const DEFAULT_CLOSE_DELAY = 3600;

/** wNEAR ledger id — paid out as native NEAR. */
export const WNEAR = 'nep141:wrap.near';

/** Ledger ids the router pays out on their own chains. */
export const DESTINATION_ASSETS = {
  ZEC: 'nep141:zec.omft.near',
  BTC: 'nep141:nbtc.bridge.near',
  NEAR: WNEAR,
} as const;

/**
 * Payout fee on the destination chain, destination units.
 *
 * - ZEC: the bridge's 20000 zat
 * - BTC: 400 sat bridge + 825 sat miner at the default 5 sat/vB
 * - NEAR: none
 */
export const PAYOUT_FEES: Record<string, bigint> = {
  [DESTINATION_ASSETS.ZEC]: 20_000n,
  [DESTINATION_ASSETS.BTC]: 1_225n,
  [DESTINATION_ASSETS.NEAR]: 0n,
};

/** Destination decimals. */
export const DESTINATION_DECIMALS: Record<string, number> = {
  [DESTINATION_ASSETS.ZEC]: 8,
  [DESTINATION_ASSETS.BTC]: 8,
  [DESTINATION_ASSETS.NEAR]: 24,
};
