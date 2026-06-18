import { erc20 } from '@galacticcouncil/common';
import type { Asset as SdkAsset } from '@galacticcouncil/sdk-next';
import type { TokenResponse } from '@defuse-protocol/one-click-sdk-typescript';

import { HYDRATION } from './chains';
import { WRAP_NEAR_ASSET, ZEC_ASSET } from './consts';
import type { XcSwapAsset } from '../types';

export const DEFAULT_DESTINATION_ASSET_IDS = [WRAP_NEAR_ASSET, ZEC_ASSET];

/** Map a 1Click token registry entry to a destination asset descriptor. */
export function tokenToAsset(token: TokenResponse): XcSwapAsset {
  return {
    key: token.assetId,
    symbol: token.symbol,
    decimals: token.decimals,
    chain: token.blockchain,
    oneClickId: token.assetId,
  };
}

/** Map an Hydration registry asset to an xc-swap origin asset descriptor. */
export function toOriginAsset(asset: SdkAsset): XcSwapAsset {
  return {
    key: String(asset.id),
    symbol: asset.symbol,
    decimals: asset.decimals,
    chain: HYDRATION.key,
    id: asset.id,
    address: erc20.ERC20.fromAssetId(asset.id) as `0x${string}`,
  };
}
