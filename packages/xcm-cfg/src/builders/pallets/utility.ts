import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  ExtrinsicConfigBuilderPrams,
} from '@moonbeam-network/xcm-builder';

const pallet = 'utility';

const batchAll = (configs: ExtrinsicConfigBuilder[]) => {
  const func = 'batchAll';
  return {
    build: (params: ExtrinsicConfigBuilderPrams) =>
      new ExtrinsicConfig({
        module: pallet,
        func,
        getArgs: () => configs.map((c) => c.build(params)),
      }),
  };
};

export const utility = () => {
  return {
    batchAll,
  };
};
