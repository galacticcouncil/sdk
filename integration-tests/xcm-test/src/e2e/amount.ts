import { Asset, AssetAmount } from '@galacticcouncil/xcm-core';

export const getAmount = async (
  amount: number,
  asset: Asset,
  assetDecimals: number
) => {
  const assetAmount = amount * 10 ** assetDecimals;
  return AssetAmount.fromAsset(asset, {
    decimals: assetDecimals,
    amount: BigInt(assetAmount),
  });
};
