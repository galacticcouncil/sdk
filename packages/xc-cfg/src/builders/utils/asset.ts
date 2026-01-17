import { AnyChain, Asset, ChainAssetId } from '@galacticcouncil/xc-core';

export function parseAssetId(assetId: ChainAssetId) {
  if (typeof assetId === 'object') {
    return Object.values(assetId)[0];
  }
  return assetId;
}

export function formatAssetIdToERC20(id: string) {
  if (id.startsWith('0x')) {
    return id;
  }

  if (!/^\d{38,39}$/.test(id)) {
    throw new Error(`Asset id: ${id} must be a string and have 38-39 digits`);
  }

  return `0xffffffff${BigInt(id).toString(16).padStart(32, '0')}`;
}

export function getAssetERC20Address(chain: AnyChain, asset: Asset) {
  const assetId = chain.getAssetId(asset);
  return typeof assetId === 'string' ? formatAssetIdToERC20(assetId) : assetId;
}
