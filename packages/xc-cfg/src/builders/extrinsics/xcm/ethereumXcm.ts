import {
  Abi,
  ContractConfigBuilder,
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
} from '@galacticcouncil/xc-core';

import { Binary } from 'polkadot-api';

import { encodeFunctionData } from 'viem';

import { XcmVersion } from './types';

const pallet = 'EthereumXcm';

const transact = (config: ContractConfigBuilder): ExtrinsicConfigBuilder => {
  const func = 'transact';
  return {
    build: async (params) => {
      const contract = await config.build(params);
      const version = XcmVersion.v1;
      const call = encodeFunctionData({
        abi: Abi[contract.module],
        functionName: contract.func,
        args: contract.args,
      });

      return new ExtrinsicConfig({
        module: pallet,
        func,
        getTx: (client) => {
          return client.getUnsafeApi().tx[pallet][func]({
            xcm_transaction: {
              type: version,
              value: {
                gas_limit: [5_000_000n, 0n, 0n, 0n],
                fee_payment: {
                  type: 'Auto',
                  value: undefined,
                },
                action: {
                  type: 'Call',
                  value: Binary.fromHex(contract.address),
                },
                value: [0n, 0n, 0n, 0n],
                input: Binary.fromHex(call),
                access_list: undefined,
              },
            },
          });
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
