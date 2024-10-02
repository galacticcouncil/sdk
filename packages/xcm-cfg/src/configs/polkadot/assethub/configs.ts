import { ExtrinsicConfigBuilder } from '@galacticcouncil/xcm-core';

import { ExtrinsicBuilder } from '../../../builders';

export const extrinsicSwap = (): ExtrinsicConfigBuilder => {
  return {
    build: (params) => {
      const { source } = params;

      const isFeeSwap = !!source.feeSwap?.enabled;
      if (isFeeSwap) {
        return ExtrinsicBuilder()
          .utility()
          .batchAll([
            ExtrinsicBuilder().assetConversion().swapTokensForExactTokens(),
            ExtrinsicBuilder()
              .polkadotXcm()
              .limitedReserveTransferAssets()
              .X2(),
          ])
          .build(params);
      }
      return ExtrinsicBuilder()
        .polkadotXcm()
        .limitedReserveTransferAssets()
        .X2()
        .build(params);
    },
  };
};
