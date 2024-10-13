import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { getAssetLocation, getNativeLocation } from './assetConversion.utils';

const pallet = 'assetConversion';

type SwapOpts = {
  withSlippage: number;
};

const swapTokensForExactTokens = (opts: SwapOpts): ExtrinsicConfigBuilder => {
  const func = 'swapTokensForExactTokens';
  return {
    build: ({ address, source }) =>
      new ExtrinsicConfig({
        module: pallet,
        func,
        getArgs: () => {
          const { chain, feeSwap, destinationFee } = source;

          const ctx = chain as Parachain;
          const assetId = ctx.getAssetId(destinationFee);
          const palletInstance = ctx.getAssetPalletInstance(destinationFee);

          const { aIn } = feeSwap!;
          const maxAmountIn =
            aIn.amount + (aIn.amount * BigInt(opts.withSlippage)) / 100n;
          const amountOut = destinationFee.amount;

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
