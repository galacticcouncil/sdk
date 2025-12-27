import { ChainAssetId } from '@galacticcouncil/xc-core';

export function parseAssetId(assetId: ChainAssetId) {
  if (typeof assetId === 'object') {
    return Object.values(assetId)[0];
  }
  return assetId;
}
