import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
} from '@galacticcouncil/xcm-core';

const pallet = 'balances';

const transferAll = (keepAlive = false): ExtrinsicConfigBuilder => {
  const func = 'transferAll';
  return {
    build: ({ address }) =>
      new ExtrinsicConfig({
        module: pallet,
        func,
        getArgs: () => {
          return [address, keepAlive];
        },
      }),
  };
};

export const balances = () => {
  return {
    transferAll,
  };
};
