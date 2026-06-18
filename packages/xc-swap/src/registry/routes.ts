import { HYDRATION, CHAINS } from './chains';
import { ONE_CLICK_ORIGIN_ASSET } from './consts';
import type { XcSwapAsset, XcSwapChain, XcSwapRoute } from '../types';

/**
 * Build route metadata for the given destination assets.
 */
export function buildRoutes(destinationAssets: XcSwapAsset[]): XcSwapRoute[] {
  return destinationAssets.map((destinationAsset) => ({
    origin: HYDRATION,
    destination: resolveChain(destinationAsset.chain),
    destinationAsset,
    oneClickOriginAsset: ONE_CLICK_ORIGIN_ASSET,
    executable: true,
  }));
}

function resolveChain(key: string): XcSwapChain {
  return (
    CHAINS.find((c) => c.key === key) ?? {
      key,
      name: key,
      platform: key as XcSwapChain['platform'],
    }
  );
}
