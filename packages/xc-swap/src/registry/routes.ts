import { HYDRATION, NEAR } from './chains';
import { DESTINATION_ASSETS } from './assets';
import { ONE_CLICK_ORIGIN_ASSET } from './consts';
import type { XcSwapRoute } from '../types';

/**
 * Supported routes. Phase 1: Hydration (any asset) → NEAR, one route per
 * supported destination asset. The bridged value enters the 1Click swap as
 * native ETH on Ethereum (`ONE_CLICK_ORIGIN_ASSET`).
 */
export const ROUTES: XcSwapRoute[] = DESTINATION_ASSETS.map(
  (destinationAsset) => ({
    origin: HYDRATION,
    destination: NEAR,
    destinationAsset,
    oneClickOriginAsset: ONE_CLICK_ORIGIN_ASSET,
    executable: true,
  })
);
