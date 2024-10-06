import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  EvmParachain,
} from '@galacticcouncil/xcm-core';

const pallet = 'router';

type SwapOpts = {
  withSlippage: number;
};

const buy = (opts: SwapOpts): ExtrinsicConfigBuilder => {
  const func = 'buy';
  return {
    build: ({ destination, source }) =>
      new ExtrinsicConfig({
        module: pallet,
        func,
        getArgs: () => {
          const ctx = source.chain as EvmParachain;
          const { aIn, route } = source.feeSwap!;
          const assetIn = ctx.getMetadataAssetId(source.fee!);
          const assetOut = ctx.getMetadataAssetId(destination.fee);

          const amountOut = destination.fee.amount;
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
