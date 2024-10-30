import {
  acc,
  big,
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xcm-core';
import {
  toAsset,
  toAssets,
  toBeneficiary,
  toDest,
  toTransactMessage,
} from './polkadotXcm.utils';

import * as v4 from './polkadotXcm.utils.v4';

import {
  getExtrinsicAccount,
  getExtrinsicArgumentVersion,
  getExtrinsicAssetLocation,
} from '../ExtrinsicBuilder.utils';

import { Parents, XcmVersion } from '../types';

const pallet = 'polkadotXcm';

const limitedReserveTransferAssets = (parents: Parents = 0) => {
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
            const rcv = destination.chain as Parachain;
            return [
              toDest(version, rcv),
              toBeneficiary(version, account),
              toAssets(version, parents, 'Here', amount),
              0,
              'Unlimited',
            ];
          },
        }),
    }),
    X2: (): ExtrinsicConfigBuilder => ({
      build: ({ address, amount, asset, destination, source }) =>
        new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: () => {
            const version = XcmVersion.v3;
            const account = getExtrinsicAccount(address);
            const ctx = source.chain as Parachain;
            const rcv = destination.chain as Parachain;
            const assetId = ctx.getAssetId(asset);
            const palletInstance = ctx.getAssetPalletInstance(asset);
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

            if (asset.key === destination.fee.key) {
              return [
                toDest(version, rcv),
                toBeneficiary(version, account),
                {
                  [version]: assets,
                },
                0,
                'Unlimited',
              ];
            }

            const feeAssetId = ctx.getAssetId(destination.fee);
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
                destination.fee.amount
              )
            );

            // Flip asset order if general index greater than fee asset
            if (Number(assetId) > Number(feeAssetId)) {
              return [
                toDest(version, rcv),
                toBeneficiary(version, account),
                {
                  [version]: assets.reverse(),
                },
                0,
                'Unlimited',
              ];
            }

            return [
              toDest(version, rcv),
              toBeneficiary(version, account),
              {
                [version]: assets,
              },
              1,
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
            const rcv = destination.chain as Parachain;
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
            const rcv = destination.chain as Parachain;
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

const teleportAssets = (parent: Parents) => {
  const func = 'teleportAssets';
  return {
    here: (): ExtrinsicConfigBuilder => ({
      build: ({ address, amount, destination }) =>
        new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: () => {
            const version = XcmVersion.v3;
            const account = getExtrinsicAccount(address);
            const rcv = destination.chain as Parachain;
            return [
              toDest(version, rcv),
              toBeneficiary(version, account),
              toAssets(version, parent, 'Here', amount),
              0,
            ];
          },
        }),
    }),
  };
};

const transferAssetsUsingTypeAndThen = (): ExtrinsicConfigBuilder => ({
  build: ({ address, asset, amount, destination, sender, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'transferAssetsUsingTypeAndThen',
      getArgs: () => {
        const version = XcmVersion.v4;
        const from = getExtrinsicAccount(sender);
        const account = getExtrinsicAccount(address);
        const ctx = source.chain as Parachain;
        const rcv = destination.chain as Parachain;

        const transferAssetLocation = getExtrinsicAssetLocation(
          ctx.getAssetXcmLocation(asset)!,
          version
        );
        const transferFeeLocation = getExtrinsicAssetLocation(
          ctx.getAssetXcmLocation(destination.fee)!,
          version
        );

        const transferAsset = v4.toAsset(transferAssetLocation, amount);
        const transferFee = v4.toAsset(
          transferFeeLocation,
          destination.fee.amount
        );

        const isSufficientPaymentAsset = asset.isEqual(destination.fee);

        const dest = v4.toDest(version, rcv);

        const assets = {
          [version]: asset.isEqual(destination.fee)
            ? [transferAsset]
            : [transferFee, transferAsset],
        };

        const assetTransferType = v4.toTransferType(
          version,
          transferAssetLocation,
          rcv
        );

        const remoteFeeId = {
          [version]: isSufficientPaymentAsset
            ? transferAssetLocation
            : transferFeeLocation,
        };

        const feesTransferType = v4.toTransferType(
          version,
          transferFeeLocation,
          rcv
        );

        const customXcmOnDest =
          destination.chain.key === 'ethereum'
            ? v4.toCustomXcmOnDest_bridge(
                version,
                account,
                from,
                transferAssetLocation
              )
            : v4.toCustomXcmOnDest(version, account);

        return [
          dest,
          assets,
          assetTransferType,
          remoteFeeId,
          feesTransferType,
          customXcmOnDest,
          'Unlimited',
        ];
      },
    }),
});

type TransactOpts = {
  fee: number;
};

const send = () => {
  const func = 'send';
  return {
    transact: (opts: TransactOpts): ExtrinsicConfigBuilder => ({
      build: (params) => {
        const { sender, source, transact } = params;
        return new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: () => {
            if (!transact) {
              throw new Error('Transact ctx configuration is missing.');
            }

            const version = XcmVersion.v3;
            const ctx = source.chain as Parachain;
            const rcv = transact.chain as Parachain;
            const mda = acc.getMultilocationDerivatedAccount(
              ctx.parachainId,
              sender,
              1
            );
            const account = getExtrinsicAccount(mda);

            const { fee } = transact;
            const feePalletInstance = ctx.getAssetPalletInstance(fee);
            const feeAmount = big.toBigInt(opts.fee, fee.decimals);

            return [
              toDest(version, rcv),
              toTransactMessage(
                version,
                account,
                { X1: { PalletInstance: feePalletInstance } },
                transact.call,
                transact.weight,
                feeAmount
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
    teleportAssets,
    transferAssetsUsingTypeAndThen,
    send,
  };
};
