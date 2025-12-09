import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  ExtrinsicConfigBuilderParams,
} from '@galacticcouncil/xc-core';

const pallet = 'Utility';

const batchAll = (configs: ExtrinsicConfigBuilder[]) => {
  const func = 'batch_all';
  return {
    build: async (params: ExtrinsicConfigBuilderParams) => {
      const cfgs = await Promise.all(configs.map((c) => c.build(params)));
      return new ExtrinsicConfig({
        module: pallet,
        func,
        getTx: (client) => {
          const decoded = cfgs.map((c) => c.getTx(client).decodedCall);
          return client.getUnsafeApi().tx[pallet][func]({ calls: decoded });
        },
      });
    },
  };
};

export const utility = () => {
  return {
    batchAll,
  };
};
