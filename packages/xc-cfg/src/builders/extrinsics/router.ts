import {
  EvmParachain,
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
} from '@galacticcouncil/xc-core';

const pallet = 'Router';

type SwapOpts = {
  slippage: number;
};

const buy = (opts: SwapOpts): ExtrinsicConfigBuilder => {
  const func = 'buy';
  return {
    build: ({ source }) =>
      new ExtrinsicConfig({
        module: pallet,
        func,
        getArgs: async () => {
          const { chain, destinationFeeSwap } = source;

          if (!destinationFeeSwap) {
            throw new Error('Swap context not found.');
          }

          const { aIn, aOut, route } = destinationFeeSwap;

          const ctx = chain as EvmParachain;
          const assetIn = ctx.getMetadataAssetId(aIn);
          const assetOut = ctx.getMetadataAssetId(aOut);

          const amountOut = aOut.amount;
          const maxAmountIn =
            aIn.amount + (aIn.amount * BigInt(opts.slippage)) / 100n;

          return [assetIn, assetOut, amountOut, maxAmountIn, route];
        },
      }),
  };
};

export const router = () => {
  return {
    buy,
  };
};
