import { multiloc } from '@galacticcouncil/xcm-core';

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
