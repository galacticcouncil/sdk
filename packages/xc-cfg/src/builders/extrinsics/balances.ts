import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
} from '@galacticcouncil/xc-core';

const pallet = 'Balances';

const transferAll = (keepAlive = false): ExtrinsicConfigBuilder => {
  const func = 'transfer_all';
  return {
    build: async ({ address }) =>
      new ExtrinsicConfig({
        module: pallet,
        func,
        getTx: (client) => {
          return client.getUnsafeApi().tx[pallet][func]({
            dest: address,
            keep_alive: keepAlive,
          });
        },
      }),
  };
};

export const balances = () => {
  return {
    transferAll,
  };
};
