import {
  Abi,
  ContractConfig,
  ContractConfigBuilder,
  Precompile,
} from '@galacticcouncil/xcm2-core';

import { encodeFunctionData } from 'viem';

const batchAll = (configs: ContractConfigBuilder[]): ContractConfigBuilder => ({
  build: async (params) => {
    const contracts = await Promise.all(configs.map((c) => c.build(params)));
    const to = contracts.map((c) => c.address);
    const value = [0, 0];
    const calldata = contracts.map((c) => {
      return encodeFunctionData({
        abi: Abi[c.module],
        functionName: c.func,
        args: c.args,
      });
    });

    return new ContractConfig({
      abi: Abi.Batch,
      address: Precompile.Batch,
      args: [to, value, calldata, []],
      func: 'batchAll',
      module: 'Batch',
    });
  },
});

export const Batch = () => {
  return {
    batchAll,
  };
};
