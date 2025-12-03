import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  ExtrinsicConfigBuilderParams,
} from '@galacticcouncil/xc-core';

const pallet = 'Utility';

const batchAll = (configs: ExtrinsicConfigBuilder[]) => {
  const func = 'batch_all';
  return {
    build: (params: ExtrinsicConfigBuilderParams) => {
      return new ExtrinsicConfig({
        module: pallet,
        func,
        getArgs: async () => configs.map((c) => c.build(params)),
      });
    },
  };
};

export const utility = () => {
  return {
    batchAll,
  };
};
