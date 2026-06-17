import type { Asset as SdkAsset } from '@galacticcouncil/sdk-next';

import { NEAR, HYDRATION } from './chains';
import { WRAP_NEAR_ASSET, toErc20 } from './consts';
import type { XcSwapAsset } from '../types';

/**
 * Phase-1 destination assets. Only wrapped NEAR is supported.
 * `decimals: 24` is NEAR's native precision (`wrap.near`).
 */
export const WRAP_NEAR: XcSwapAsset = {
  key: 'wrap.near',
  symbol: 'wNEAR',
  decimals: 24,
  chain: NEAR.key,
  oneClickId: WRAP_NEAR_ASSET,
};

export const DESTINATION_ASSETS: XcSwapAsset[] = [WRAP_NEAR];

/** Look up a supported destination asset by its 1Click id. */
export function getDestinationAsset(
  oneClickId: string
): XcSwapAsset | undefined {
  return DESTINATION_ASSETS.find((a) => a.oneClickId === oneClickId);
}

/** Map an sdk-next Hydration asset to an xc-swap origin asset descriptor. */
export function toOriginAsset(asset: SdkAsset): XcSwapAsset {
  return {
    key: String(asset.id),
    symbol: asset.symbol,
    decimals: asset.decimals,
    chain: HYDRATION.key,
    id: asset.id,
    address: toErc20(asset.id),
  };
}
