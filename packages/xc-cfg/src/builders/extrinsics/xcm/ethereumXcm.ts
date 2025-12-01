import {
  Abi,
  ContractConfigBuilder,
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
} from '@galacticcouncil/xc-core';

import { encodeFunctionData } from 'viem';

import { XcmVersion } from './types';

const pallet = 'EthereumXcm';

const transact = (config: ContractConfigBuilder): ExtrinsicConfigBuilder => {
  const func = 'transact';
  return {
    build: (params) => {
      return new ExtrinsicConfig({
        module: pallet,
        func,
        getArgs: async () => {
          const contract = await config.build(params);
          const version = XcmVersion.v1;
          const call = encodeFunctionData({
            abi: Abi[contract.module],
            functionName: contract.func,
            args: contract.args,
          });
          return [
            {
              [version]: {
                gasLimit: 5000000n,
                feePayment: 'Auto',
                action: {
                  Call: contract.address,
                },
                value: 0n,
                input: call,
              },
            },
          ];
        },
      });
    },
  };
};

export const ethereumXcm = () => {
  return {
    transact,
  };
};
