import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  ExtrinsicConfigBuilderParams,
  Parachain,
} from '@galacticcouncil/xcm-core';

const pallet = 'utility';

const batchAll = (configs: ExtrinsicConfigBuilder[]) => {
  const func = 'batchAll';
  return {
    build: (params: ExtrinsicConfigBuilderParams) => {
      const { source } = params;

      const ctx = source.chain as Parachain;
      const swap = source.feeSwap;

      let txOptions;
      if (swap) {
        const assetLocation = ctx.getAssetXcmLocation(swap.aIn);
        txOptions = {
          asset: assetLocation,
        };
      }

      return new ExtrinsicConfig({
        module: pallet,
        func,
        txOptions,
        getArgs: () => configs.map((c) => c.build(params)),
      });
    },
  };
};

export const utility = () => {
  return {
    batchAll,
  };
};
