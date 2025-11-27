import { ChainAssetId } from '@galacticcouncil/xcm2-core';

export function parseAssetId(assetId: ChainAssetId) {
  if (typeof assetId === 'object') {
    return Object.values(assetId)[0];
  }
  return assetId;
}
