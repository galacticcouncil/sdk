// V2 Gateway gas budget. When `true`, the fee builder uses Fiat-Shamir gas
// (paid premium) instead of the default two-phase submit gas. Selected
// per-route via Tag.SnowbridgeFast.
export type SnowbridgeFast = boolean;

export const SNOWBRIDGE_BASE_DISPATCH_GAS = 80_000n;
export const SNOWBRIDGE_BASE_VERIFICATION_GAS = 120_000n;
export const SNOWBRIDGE_TOKEN_DELIVERY_GAS = 100_000n;
export const SNOWBRIDGE_SUBMIT_GAS = 1_000_000n;
export const SNOWBRIDGE_FIAT_SHAMIR_GAS = 2_000_000n;

// Ether existential deposit on AssetHub (15 µETH).
export const ASSETHUB_ETHER_ED = 15_000_000_000_000n;
