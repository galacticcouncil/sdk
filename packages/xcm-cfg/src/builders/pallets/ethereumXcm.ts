import {
  ExtrinsicConfigBuilderParamsV2,
  Abi,
  Precompile,
} from '@galacticcouncil/xcm-core';
import {
  XcmVersion,
  ExtrinsicConfigBuilder,
  ExtrinsicConfig,
} from '@moonbeam-network/xcm-builder';
import { encodeFunctionData } from 'viem';

import { formatDestAddress } from './ethereumXcm.utils';

const pallet = 'ethereumXcm';

const transact = () => {
  const func = 'transact';
  return {
    batch: (
      destChain: number,
      relayerAddress: string
    ): ExtrinsicConfigBuilder => ({
      build: (params) => {
        const { amount, address, asset } =
          params as ExtrinsicConfigBuilderParamsV2;
        return new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: () => {
            const version = XcmVersion.v1;
            const approveTx = encodeFunctionData({
              abi: Abi.IERC20,
              functionName: 'approve',
              args: [relayerAddress, amount],
            });
            const transferTx = encodeFunctionData({
              abi: Abi.TokenRelayer,
              functionName: 'transferTokensWithRelay',
              args: [
                asset,
                amount,
                0,
                destChain,
                formatDestAddress(address),
                0,
              ],
            });
            const batchTx = encodeFunctionData({
              abi: Abi.Batch,
              functionName: 'batchAll',
              args: [
                [asset, relayerAddress],
                [0, 0],
                [approveTx, transferTx],
                [],
              ],
            });
            return [
              {
                [version]: {
                  gasLimit: 350000n,
                  feePayment: 'Auto',
                  action: {
                    Call: Precompile.Batch,
                  },
                  value: 0n,
                  input: batchTx,
                },
              },
            ];
          },
        });
      },
    }),
  };
};

export const ethereumXcm = () => {
  return {
    transact,
  };
};
