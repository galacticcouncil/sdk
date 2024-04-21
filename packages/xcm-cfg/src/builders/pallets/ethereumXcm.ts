import {
  Abi,
  ContractConfigBuilderV2,
  ExtrinsicConfigBuilderV2,
} from '@galacticcouncil/xcm-core';
import { XcmVersion, ExtrinsicConfig } from '@moonbeam-network/xcm-builder';
import { encodeFunctionData } from 'viem';

const pallet = 'ethereumXcm';

const transact = (
  config: ContractConfigBuilderV2
): ExtrinsicConfigBuilderV2 => {
  const func = 'transact';
  return {
    build: (params) => {
      return new ExtrinsicConfig({
        module: pallet,
        func,
        getArgs: () => {
          const contract = config.build(params);
          const version = XcmVersion.v1;
          const call = encodeFunctionData({
            abi: Abi[contract.module],
            functionName: contract.func,
            args: contract.args,
          });
          return [
            {
              [version]: {
                gasLimit: 350000n,
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
