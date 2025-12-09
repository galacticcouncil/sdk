import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xc-core';

const pallet = 'AssetConversion';

type SwapOpts = {
  slippage: number;
};

const swapTokensForExactTokens = (opts: SwapOpts): ExtrinsicConfigBuilder => {
  const func = 'swap_tokens_for_exact_tokens';
  return {
    build: async ({ address, source }) => {
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

      return new ExtrinsicConfig({
        module: pallet,
        func,
        getTx: (client) => {
          return client.getUnsafeApi().tx[pallet][func]({
            path: [aInLocation, aOutLocation],
            amount_out: amountOut,
            amount_in_max: maxAmountIn,
            send_to: address,
            keep_alive: true,
          });
        },
      });
    },
  };
};

export const assetConversion = () => {
  return {
    swapTokensForExactTokens,
  };
};
