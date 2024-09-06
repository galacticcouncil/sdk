import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { getAssetLocation, getNativeLocation } from './assetConversion.utils';

const pallet = 'assetConversion';

const swapTokensForExactTokens = (): ExtrinsicConfigBuilder => {
  const func = 'swapTokensForExactTokens';
  return {
    build: ({ address, fee, source }) =>
      new ExtrinsicConfig({
        module: pallet,
        func,
        getArgs: () => {
          const ctx = source as Parachain;
          const assetId = ctx.getAssetId(fee);
          const palletInstance = ctx.getAssetPalletInstance(fee);

          console.log(fee);

          return [
            [
              getNativeLocation(),
              getAssetLocation(assetId.toString(), palletInstance),
            ],
            fee.amount,
            10000000000, //native (DOT) 0.02 USDT = 0.0397991175 DOT
            address,
            true,
          ];
        },
      }),
  };
};

export const assetConversion = () => {
  return {
    swapTokensForExactTokens,
  };
};
