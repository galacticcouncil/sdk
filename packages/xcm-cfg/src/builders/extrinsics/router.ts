import {
  EvmParachain,
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
} from '@galacticcouncil/xcm-core';

const pallet = 'router';

type SwapOpts = {
  withSlippage: number;
};

const buy = (opts: SwapOpts): ExtrinsicConfigBuilder => {
  const func = 'buy';
  return {
    build: ({ source }) =>
      new ExtrinsicConfig({
        module: pallet,
        func,
        getArgs: () => {
          const { chain, fee, feeSwap, destinationFee } = source;

          const ctx = chain as EvmParachain;
          const assetIn = ctx.getMetadataAssetId(fee);
          const assetOut = ctx.getMetadataAssetId(destinationFee);

          const { aIn, route } = feeSwap!;
          const amountOut = destinationFee.amount;
          const maxAmountIn =
            aIn.amount + (aIn.amount * BigInt(opts.withSlippage)) / 100n;
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
