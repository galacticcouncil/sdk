import { ExtrinsicConfigBuilderParamsV2 } from '@galacticcouncil/xcm-core';
import {
  XcmVersion,
  ExtrinsicConfigBuilder,
  ExtrinsicConfig,
  Parents,
} from '@moonbeam-network/xcm-builder';
import { toBigInt } from '@moonbeam-network/xcm-utils';
import {
  toAssets,
  toBeneficiary,
  toDest,
  toTransactMessage,
} from './polkadotXcm.utils';
import { getExtrinsicAccount } from '../ExtrinsicBuilder.utils';

const pallet = 'polkadotXcm';

const limitedReserveTransferAssets = () => {
  const func = 'limitedReserveTransferAssets';
  return {
    X2: (): ExtrinsicConfigBuilder => ({
      build: ({ address, amount, asset, destination, palletInstance }) =>
        new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: () => {
            const version = XcmVersion.v3;
            const account = getExtrinsicAccount(address);
            return [
              toDest(version, destination),
              toBeneficiary(version, account),
              toAssets(
                version,
                0,
                {
                  X2: [
                    {
                      PalletInstance: palletInstance,
                    },
                    {
                      GeneralIndex: asset,
                    },
                  ],
                },
                amount
              ),
              0,
              'Unlimited',
            ];
          },
        }),
    }),
  };
};

const limitedTeleportAssets = (parent: Parents) => {
  const func = 'limitedTeleportAssets';
  return {
    here: (): ExtrinsicConfigBuilder => ({
      build: ({ address, amount, destination }) =>
        new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: () => {
            const version = XcmVersion.v2;
            const account = getExtrinsicAccount(address);
            return [
              toDest(version, destination),
              toBeneficiary(version, account),
              toAssets(version, parent, 'Here', amount),
              0,
              'Unlimited',
            ];
          },
        }),
    }),
  };
};

const reserveTransferAssets = () => {
  const func = 'reserveTransferAssets';
  return {
    here: (): ExtrinsicConfigBuilder => ({
      build: ({ address, amount, destination }) =>
        new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: () => {
            const version = XcmVersion.v3;
            const account = getExtrinsicAccount(address);
            return [
              toDest(version, destination),
              toBeneficiary(version, account),
              toAssets(version, 0, 'Here', amount),
              0,
            ];
          },
        }),
    }),
  };
};

const send = () => {
  const func = 'send';
  return {
    transact: (executionCost: number): ExtrinsicConfigBuilder => ({
      build: (params) => {
        const {
          address,
          destination,
          feeDecimals,
          feePalletInstance,
          transact,
        } = params as ExtrinsicConfigBuilderParamsV2;
        return new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: () => {
            if (!transact) {
              throw new Error('Ethereum transact must be provided');
            }
            const version = XcmVersion.v3;
            const account = getExtrinsicAccount(address);
            return [
              toDest(version, destination),
              toTransactMessage(
                version,
                account,
                { X1: { PalletInstance: feePalletInstance } },
                transact.call,
                transact.weight,
                toBigInt(executionCost, feeDecimals!)
              ),
            ];
          },
        });
      },
    }),
  };
};

export const polkadotXcm = () => {
  return {
    limitedReserveTransferAssets,
    limitedTeleportAssets,
    reserveTransferAssets,
    send,
  };
};
