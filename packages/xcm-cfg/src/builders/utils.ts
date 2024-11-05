import { ChainAssetId } from '@galacticcouncil/xcm-core';

export function parseAssetId(assetId: ChainAssetId) {
  if (typeof assetId === 'object') {
    return Object.values(assetId)[0];
  }
  return assetId;
}
