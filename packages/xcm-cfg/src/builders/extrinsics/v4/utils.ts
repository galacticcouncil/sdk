import { Asset, Parachain } from '@galacticcouncil/xcm-core';

export function locationGuard(chain: Parachain, asset: Asset) {
  const location = chain.getAssetXcmLocation(asset);
  if (!location) {
    throw new Error(asset.originSymbol + ' location config is missing.');
  }
  return location;
}
