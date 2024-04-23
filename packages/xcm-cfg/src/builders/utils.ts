import { ChainAssetId } from '@galacticcouncil/xcm-core';

/**
 * Format recipient address on the destination chain in 32 bytes (left padded)
 *
 * @param address 20 bytes 0x address
 * @returns 32 bytes 0x address
 */
export function formatDestAddress(address: string) {
  return '0x000000000000000000000000' + address.substring(2);
}

export function parseAssetId(assetId: ChainAssetId) {
  if (typeof assetId === 'object') {
    return Object.values(assetId)[0];
  }
  return assetId;
}
