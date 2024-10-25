import { Asset, AssetAmount } from '@galacticcouncil/xcm-core';
import { Metadata } from '@galacticcouncil/xcm-sdk';

export const buildAmount = async (
  amount: number,
  asset: Asset,
  metadata: Metadata
) => {
  const assetDecimals = await metadata.getDecimals(asset);
  const assetAmount = amount * 10 ** assetDecimals;
  return AssetAmount.fromAsset(asset, {
    decimals: assetDecimals,
    amount: BigInt(assetAmount),
  });
};
