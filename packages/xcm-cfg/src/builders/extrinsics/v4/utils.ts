import { multiloc, Asset, Parachain } from '@galacticcouncil/xcm-core';

import { XcmVersion } from '../../types';

export function locationOrError(chain: Parachain, asset: Asset) {
  const location = chain.getAssetXcmLocation(asset);
  if (!location) {
    throw new Error(asset.originSymbol + ' location config is missing.');
  }
  return location;
}

export function getX1Junction(version: XcmVersion, junction: any) {
  const versionNo = version.toString().replace('V', '').replace('v', '');
  return Number(versionNo) >= 4 ? [junction] : junction;
}

export function shouldFeeAssetPrecede(
  transferAssetLocation: any,
  transferFeeLocation: any
) {
  const assetGeneralIndex = multiloc.findNestedKey(
    transferAssetLocation,
    'GeneralIndex'
  );

  const feeGeneralIndex = multiloc.findNestedKey(
    transferFeeLocation,
    'GeneralIndex'
  );

  const assetIndex = assetGeneralIndex && assetGeneralIndex['GeneralIndex'];
  const feeIndex = feeGeneralIndex && feeGeneralIndex['GeneralIndex'];

  if (Number.isNaN(assetIndex) || Number.isNaN(feeIndex)) {
    return false;
  }

  return Number(assetIndex) > Number(feeIndex);
}
