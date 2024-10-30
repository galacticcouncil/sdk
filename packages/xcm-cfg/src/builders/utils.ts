import { ChainAssetId } from '@galacticcouncil/xcm-core';

export function parseAssetId(assetId: ChainAssetId) {
  if (typeof assetId === 'object') {
    return Object.values(assetId)[0];
  }
  return assetId;
}

export const findNestedKey = (assetLocation: object, keyToFind: any) => {
  const foundObj: any[] = [];
  JSON.stringify(assetLocation, (_, nestedValue) => {
    const v =
      typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue;
    if (nestedValue && nestedValue[keyToFind]) {
      foundObj.push(v);
    }
    return v;
  });
  return foundObj[0];
};
