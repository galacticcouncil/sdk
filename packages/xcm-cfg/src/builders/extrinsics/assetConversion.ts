import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { getAssetLocation } from './assetConversion.utils';

const pallet = 'assetConversion';

type SwapOpts = {
  slippage: number;
};

const swapTokensForExactTokens = (opts: SwapOpts): ExtrinsicConfigBuilder => {
  const func = 'swapTokensForExactTokens';
  return {
    build: ({ address, source }) =>
      new ExtrinsicConfig({
        module: pallet,
        func,
        getArgs: async () => {
          const { chain } = source;

          const swapCtx = source.destinationFeeSwap || source.feeSwap;
          if (!swapCtx) {
            throw new Error('Swap context not found.');
          }

          const { aIn, aOut } = swapCtx;

          const ctx = chain as Parachain;
          const aInLocation = ctx.getAssetXcmLocation(aIn);
          const aOutLocation = ctx.getAssetXcmLocation(aOut);

          const maxAmountIn =
            aIn.amount + (aIn.amount * BigInt(opts.slippage)) / 100n;
          const amountOut = aOut.amount;

          return [
            [getAssetLocation(aInLocation), getAssetLocation(aOutLocation)],
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
