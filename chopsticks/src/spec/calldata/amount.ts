import { AnyChain, Asset, AssetAmount } from '@galacticcouncil/xc-core';

export const getAmount = async (
  amount: number,
  asset: Asset,
  chain: AnyChain
) => {
  const { decimals } = await chain.getCurrency();
  const assetDecimals = chain.getAssetDecimals(asset) || decimals;
  const assetAmount = Math.floor(amount ** assetDecimals);
  return AssetAmount.fromAsset(asset, {
    decimals: assetDecimals,
    amount: BigInt(assetAmount),
  });
};
