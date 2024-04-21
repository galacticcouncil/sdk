import { ContractConfigBuilderV2 } from '@galacticcouncil/xcm-core';
import { ContractBuilder } from '@moonbeam-network/xcm-builder';

export function Xtokens() {
  return {
    transfer: (): ContractConfigBuilderV2 => ({
      build: (params) => {
        const { address, amount, asset, destination, fee, source } = params;
        const assetId = source.getAssetId(asset);
        const feeAssetId = source.getAssetId(fee);
        return ContractBuilder().Xtokens().transfer().build({
          address,
          amount,
          destination,
          asset: assetId,
          feeAsset: feeAssetId,
          fee: fee.amount,
        });
      },
    }),
    transferMultiCurrencies: (): ContractConfigBuilderV2 => ({
      build: (params) => {
        const { address, amount, asset, destination, fee, source } = params;
        const assetId = source.getAssetId(asset);
        const feeAssetId = source.getAssetId(fee);
        return ContractBuilder().Xtokens().transferMultiCurrencies().build({
          address,
          amount,
          destination,
          asset: assetId,
          feeAsset: feeAssetId,
          fee: fee.amount,
        });
      },
    }),
  };
}
