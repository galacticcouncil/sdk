import {
  acc,
  big,
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xcm-core';

import {
  toAsset,
  toBeneficiary,
  toBridgeXcmOnDest,
  toParaXcmOnDest,
  toDest,
  toTransferType,
  toTransactMessage,
} from './polkadotXcm.utils';

import {
  getExtrinsicAccount,
  getExtrinsicArgumentVersion,
  getExtrinsicAssetLocation,
  locationOrError,
  shouldFeeAssetPrecede,
} from './utils';
import { XcmTransferType, XcmVersion } from './types';

const pallet = 'polkadotXcm';

const limitedReserveTransferAssets = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'limitedReserveTransferAssets',
      getArgs: (func) => {
        const version = getExtrinsicArgumentVersion(func, 2);
        const account = getExtrinsicAccount(address);
        const ctx = source.chain as Parachain;
        const rcv = destination.chain as Parachain;

        const transferAssetLocation = getExtrinsicAssetLocation(
          locationOrError(ctx, asset),
          version
        );
        const transferFeeLocation = getExtrinsicAssetLocation(
          locationOrError(ctx, destination.fee),
          version
        );

        const transferAsset = toAsset(transferAssetLocation, amount);
        const transferFee = toAsset(
          transferFeeLocation,
          destination.fee.amount
        );

        if (asset.key === destination.fee.key) {
          return [
            toDest(version, rcv),
            toBeneficiary(version, account),
            {
              [version]: [transferAsset],
            },
            0,
            'Unlimited',
          ];
        }

        // Flip asset order if general index of asset greater than fee asset
        if (shouldFeeAssetPrecede(transferAssetLocation, transferFeeLocation)) {
          return [
            toDest(version, rcv),
            toBeneficiary(version, account),
            {
              [version]: [transferFee, transferAsset],
            },
            0,
            'Unlimited',
          ];
        }

        return [
          toDest(version, rcv),
          toBeneficiary(version, account),
          {
            [version]: [transferAsset, transferFee],
          },
          1,
          'Unlimited',
        ];
      },
    }),
});

const limitedTeleportAssets = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'limitedTeleportAssets',
      getArgs: (func) => {
        const version = getExtrinsicArgumentVersion(func, 2);
        const account = getExtrinsicAccount(address);
        const ctx = source.chain as Parachain;
        const rcv = destination.chain as Parachain;

        const transferAssetLocation = getExtrinsicAssetLocation(
          locationOrError(ctx, asset),
          version
        );
        const transferAsset = toAsset(transferAssetLocation, amount);

        const dest = toDest(version, rcv);
        const beneficiary = toBeneficiary(version, account);
        const assets = {
          [version]: [transferAsset],
        };
        return [dest, beneficiary, assets, 0, 'Unlimited'];
      },
    }),
});

const reserveTransferAssets = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'reserveTransferAssets',
      getArgs: (func) => {
        const version = getExtrinsicArgumentVersion(func, 2);
        const account = getExtrinsicAccount(address);
        const ctx = source.chain as Parachain;
        const rcv = destination.chain as Parachain;

        const transferAssetLocation = getExtrinsicAssetLocation(
          locationOrError(ctx, asset),
          version
        );
        const transferAsset = toAsset(transferAssetLocation, amount);

        const dest = toDest(version, rcv);
        const beneficiary = toBeneficiary(version, account);
        const assets = {
          [version]: [transferAsset],
        };
        return [dest, beneficiary, assets, 0];
      },
    }),
});

type TransferOpts = {
  transferType: XcmTransferType;
};

const transferAssetsUsingTypeAndThen = (
  opts: TransferOpts
): ExtrinsicConfigBuilder => ({
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

        const { transferType } = opts;

        const transferAssetLocation = getExtrinsicAssetLocation(
          locationOrError(ctx, asset),
          version
        );
        const transferFeeLocation = getExtrinsicAssetLocation(
          locationOrError(ctx, destination.fee),
          version
        );

        const transferAsset = toAsset(transferAssetLocation, amount);
        const transferFee = toAsset(
          transferFeeLocation,
          destination.fee.amount
        );

        const isSufficientPaymentAsset = asset.isEqual(destination.fee);

        const dest = toDest(version, rcv);

        const assets = {
          [version]: asset.isEqual(destination.fee)
            ? [transferAsset]
            : [transferFee, transferAsset],
        };

        const assetTransferType = toTransferType(
          version,
          transferType,
          transferAssetLocation
        );

        const remoteFeeId = {
          [version]: isSufficientPaymentAsset
            ? transferAssetLocation
            : transferFeeLocation,
        };

        const feesTransferType = toTransferType(
          version,
          transferType,
          transferFeeLocation
        );

        const customXcmOnDest =
          destination.chain.key === 'ethereum'
            ? toBridgeXcmOnDest(version, account, from, transferAssetLocation)
            : toParaXcmOnDest(version, account);

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
            const version = XcmVersion.v4;

            if (!transact) {
              throw new Error('Transact ctx configuration is missing.');
            }

            const ctx = source.chain as Parachain;
            const rcv = transact.chain as Parachain;
            const mda = acc.getMultilocationDerivatedAccount(
              ctx.parachainId,
              sender,
              1
            );
            const account = getExtrinsicAccount(mda);

            const { fee } = transact;
            const transactFeeLocation = getExtrinsicAssetLocation(
              locationOrError(rcv, fee),
              version
            );
            const transactFeeAmount = big.toBigInt(opts.fee, fee.decimals);

            return [
              toDest(version, rcv),
              toTransactMessage(
                version,
                account,
                transactFeeLocation,
                transactFeeAmount,
                transact.call,
                transact.weight
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
    transferAssetsUsingTypeAndThen,
    send,
  };
};
