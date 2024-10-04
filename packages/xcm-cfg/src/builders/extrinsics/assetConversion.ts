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
    build: ({ address, destination, source }) =>
      new ExtrinsicConfig({
        module: pallet,
        func,
        getArgs: () => {
          const ctx = source.chain as Parachain;
          const assetId = ctx.getAssetId(destination.fee);
          const palletInstance = ctx.getAssetPalletInstance(destination.fee);

          const { aIn } = source.feeSwap!;
          const maxAmountIn = aIn.amount + (aIn.amount * 30n) / 100n;
          const amountOut = destination.fee.amount;

          return [
            [
              getNativeLocation(),
              getAssetLocation(assetId.toString(), palletInstance),
            ],
            amountOut,
            maxAmountIn,
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
