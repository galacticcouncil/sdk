import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  EvmParachain,
} from '@galacticcouncil/xcm-core';

const pallet = 'router';

const buy = (): ExtrinsicConfigBuilder => {
  const func = 'buy';
  return {
    build: ({ destination, source, swap }) =>
      new ExtrinsicConfig({
        module: pallet,
        func,
        getArgs: () => {
          const ctx = source.chain as EvmParachain;
          const amount = swap?.amount!;
          const route = swap?.route!;
          const assetIn = ctx.getAssetId(source.fee!);
          const assetOut = ctx.getAssetId(destination.fee);

          const amountOut = destination.fee.amount;
          const maxAmountIn = amount + (amount * 5n) / 100n;
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
