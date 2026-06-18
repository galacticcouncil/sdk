import type { XcSwapChain } from '../types';

/** Origin chain — Hydration's EVM execution layer (where `swapAndBridge` runs). */
export const HYDRATION: XcSwapChain = {
  key: 'hydration',
  name: 'Hydration',
  platform: 'hydration',
};

/** Destination chain — NEAR (where the wrap.near swap settles). */
export const NEAR: XcSwapChain = {
  key: 'near',
  name: 'NEAR',
  platform: 'near',
};

/** Destination chain — Zcash (where the ZEC swap settles). */
export const ZEC: XcSwapChain = {
  key: 'zec',
  name: 'Zcash',
  platform: 'zec',
};

/** All chains the SDK touches. */
export const CHAINS: XcSwapChain[] = [HYDRATION, NEAR, ZEC];
