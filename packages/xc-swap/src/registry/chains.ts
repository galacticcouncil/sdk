import { HYDRATION_EVM_CHAIN_ID } from './consts';
import type { XcSwapChain } from '../types';

/** Origin chain — Hydration's EVM execution layer (where `swapAndBridge` runs). */
export const HYDRATION: XcSwapChain = {
  key: 'hydration',
  name: 'Hydration',
  platform: 'hydration-evm',
  evmChainId: HYDRATION_EVM_CHAIN_ID,
};

/** Destination chain — NEAR (where the 1Click swap settles). */
export const NEAR: XcSwapChain = {
  key: 'near',
  name: 'NEAR',
  platform: 'near',
};

/** All chains the SDK touches. */
export const CHAINS: XcSwapChain[] = [HYDRATION, NEAR];
