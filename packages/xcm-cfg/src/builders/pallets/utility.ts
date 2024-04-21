import {
  ExtrinsicConfigBuilderV2,
  ExtrinsicConfigBuilderParamsV2,
} from '@galacticcouncil/xcm-core';
import { ExtrinsicConfig } from '@moonbeam-network/xcm-builder';

const pallet = 'utility';

const batchAll = (configs: ExtrinsicConfigBuilderV2[]) => {
  const func = 'batchAll';
  return {
    build: (params: ExtrinsicConfigBuilderParamsV2) =>
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
