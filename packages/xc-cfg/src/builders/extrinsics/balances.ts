import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
} from '@galacticcouncil/xc-core';

const pallet = 'Balances';

const transferAll = (keepAlive = false): ExtrinsicConfigBuilder => {
  const func = 'transfer_all';
  return {
    build: ({ address }) =>
      new ExtrinsicConfig({
        module: pallet,
        func,
        getArgs: () => {
          return {
            dest: address,
            keep_alive: keepAlive,
          };
        },
      }),
  };
};

export const balances = () => {
  return {
    transferAll,
  };
};
