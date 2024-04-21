import { ExtrinsicConfigBuilderV2 } from '@galacticcouncil/xcm-core';
import { ExtrinsicBuilder } from '@moonbeam-network/xcm-builder';

export function xTransfer() {
  return {
    transfer: () => {
      return {
        here: (): ExtrinsicConfigBuilderV2 => ({
          build: (params) => {
            const { address, amount, asset, destination, fee, source } = params;
            const assetId = source.getAssetId(asset);
            const feeAssetId = source.getAssetId(fee);
            return ExtrinsicBuilder().xTransfer().transfer().here().build({
              address,
              amount,
              destination,
              source,
              asset: assetId,
              feeAsset: feeAssetId,
              fee: fee.amount,
            });
          },
        }),
      };
    },
  };
}
