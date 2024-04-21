import {
  Abi,
  ContractConfigBuilderV2,
  Precompile,
} from '@galacticcouncil/xcm-core';

import { ContractConfig } from '@moonbeam-network/xcm-builder';

import { encodeFunctionData } from 'viem';

const batchAll = (
  configs: ContractConfigBuilderV2[]
): ContractConfigBuilderV2 => ({
  build: (params) => {
    const contracts = configs.map((c) => c.build(params));
    const to = contracts.map((c) => c.address);
    const value = [0, 0];
    const calldata = contracts.map((c) => {
      console.log(c);
      return encodeFunctionData({
        abi: Abi[c.module],
        functionName: c.func,
        args: c.args,
      });
    });

    return new ContractConfig({
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
