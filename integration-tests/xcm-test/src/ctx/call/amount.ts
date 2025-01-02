import { AnyChain, Asset, AssetAmount } from '@galacticcouncil/xcm-core';

export const getAmount = async (
  amount: number,
  asset: Asset,
  chain: AnyChain
) => {
  const { decimals } = await chain.getCurrency();
  const assetDecimals = chain.getAssetDecimals(asset) || decimals;
  const assetAmount = amount * 10 ** assetDecimals;
  return AssetAmount.fromAsset(asset, {
    decimals: assetDecimals,
    amount: BigInt(assetAmount),
  });
};
