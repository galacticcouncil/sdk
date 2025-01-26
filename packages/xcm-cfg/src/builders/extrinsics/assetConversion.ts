import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { getAssetLocation } from './assetConversion.utils';

const pallet = 'assetConversion';

type SwapOpts = {
  withSlippage: number;
  key: 'feeSwap' | 'destinationFeeSwap';
};

const swapTokensForExactTokens = (opts: SwapOpts): ExtrinsicConfigBuilder => {
  const func = 'swapTokensForExactTokens';
  return {
    build: ({ address, source }) =>
      new ExtrinsicConfig({
        module: pallet,
        func,
        getArgs: () => {
          const { chain } = source;

          const { aIn, aOut } = source[opts.key]!;

          const ctx = chain as Parachain;
          const aInLocation = ctx.getAssetXcmLocation(aIn);
          const aOutLocation = ctx.getAssetXcmLocation(aOut);

          const maxAmountIn =
            aIn.amount + (aIn.amount * BigInt(opts.withSlippage)) / 100n;
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
