import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
} from '@galacticcouncil/xcm-core';

const pallet = 'balances';

const transferAll = (): ExtrinsicConfigBuilder => {
  const func = 'transferAll';
  return {
    build: ({ address }) =>
      new ExtrinsicConfig({
        module: pallet,
        func,
        getArgs: () => {
          return [address, false];
        },
      }),
  };
};

export const balances = () => {
  return {
    transferAll,
  };
};
