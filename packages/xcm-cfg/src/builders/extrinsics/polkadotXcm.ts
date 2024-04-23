import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xcm-core';
import { toBigInt } from '@moonbeam-network/xcm-utils';
import {
  toAsset,
  toAssets,
  toBeneficiary,
  toDest,
  toTransactMessage,
} from './polkadotXcm.utils';
import {
  getExtrinsicAccount,
  getExtrinsicArgumentVersion,
  getTransactAccount,
  Parents,
  XcmVersion,
} from '../ExtrinsicBuilder.utils';

const pallet = 'polkadotXcm';

const limitedReserveTransferAssets = () => {
  const func = 'limitedReserveTransferAssets';
  return {
    here: (): ExtrinsicConfigBuilder => ({
      build: ({ address, amount, destination }) =>
        new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: (ext) => {
            const version = getExtrinsicArgumentVersion(ext);
            const account = getExtrinsicAccount(address);
            const rcv = destination as Parachain;
            return [
              toDest(version, rcv),
              toBeneficiary(version, account),
              toAssets(version, 0, 'Here', amount),
              0,
              'Unlimited',
            ];
          },
        }),
    }),
    X1: (): ExtrinsicConfigBuilder => ({
      build: ({ address, amount, destination }) =>
        new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: () => {
            const version = XcmVersion.v1;
            const account = getExtrinsicAccount(address);
            const rcv = destination as Parachain;
            return [
              toDest(version, rcv),
              toBeneficiary(version, account),
              toAssets(version, 0, 'Here', amount),
              0,
              'Unlimited',
            ];
          },
        }),
    }),
    X2: (): ExtrinsicConfigBuilder => ({
      build: ({ address, amount, asset, destination, fee, source }) =>
        new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: () => {
            const version = XcmVersion.v3;
            const account = getExtrinsicAccount(address);
            const ctx = source as Parachain;
            const rcv = destination as Parachain;
            const assetId = ctx.getAssetId(asset);
            const palletInstance = ctx.getAssetPalletInstance(asset);
            const isAssetDifferent = !!fee && asset.key !== fee.key;
            const assets = [
              toAsset(
                0,
                {
                  X2: [
                    {
                      PalletInstance: palletInstance,
                    },
                    {
                      GeneralIndex: assetId,
                    },
                  ],
                },
                amount
              ),
            ];

            if (isAssetDifferent) {
              const feeAssetId = ctx.getAssetId(fee);
              assets.push(
                toAsset(
                  0,
                  {
                    X2: [
                      {
                        PalletInstance: palletInstance,
                      },
                      {
                        GeneralIndex: feeAssetId,
                      },
                    ],
                  },
                  fee.amount
                )
              );
            }

            return [
              toDest(version, rcv),
              toBeneficiary(version, account),
              {
                [version]: assets,
              },
              isAssetDifferent ? 1 : 0,
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
            const rcv = destination as Parachain;
            return [
              toDest(version, rcv),
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
            const rcv = destination as Parachain;
            return [
              toDest(version, rcv),
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
        const { destination, fee, source, transact, transactVia } = params;
        return new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: () => {
            if (!transact) {
              throw new Error('Ethereum transact not provided');
            }

            const version = XcmVersion.v3;
            const account = getTransactAccount(params);
            const ctx = source as Parachain;
            const rcv = destination as Parachain;
            const feePalletInstance = ctx.getAssetPalletInstance(fee);
            return [
              toDest(version, transactVia || rcv),
              toTransactMessage(
                version,
                account,
                { X1: { PalletInstance: feePalletInstance } },
                transact.call,
                transact.weight,
                toBigInt(executionCost, fee.decimals)
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
