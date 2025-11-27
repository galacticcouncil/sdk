import {
  big,
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xcm-core';

import {
  toAsset,
  toBeneficiary,
  toBridgeXcmOnDest,
  toDepositXcmOnDest,
  toDest,
  toTransferType,
  toTransactMessage,
  toTransferMessage,
} from './polkadotXcm.utils';

import {
  getDerivativeAccount,
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
      getArgs: async (func) => {
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
            toDest(version, ctx, rcv),
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
            toDest(version, ctx, rcv),
            toBeneficiary(version, account),
            {
              [version]: [transferFee, transferAsset],
            },
            0,
            'Unlimited',
          ];
        }

        return [
          toDest(version, ctx, rcv),
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
      getArgs: async (func) => {
        const version = getExtrinsicArgumentVersion(func, 2);
        const account = getExtrinsicAccount(address);
        const ctx = source.chain as Parachain;
        const rcv = destination.chain as Parachain;

        const transferAssetLocation = getExtrinsicAssetLocation(
          locationOrError(ctx, asset),
          version
        );
        const transferAsset = toAsset(transferAssetLocation, amount);

        const dest = toDest(version, ctx, rcv);
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
      getArgs: async (func) => {
        const version = getExtrinsicArgumentVersion(func, 2);
        const account = getExtrinsicAccount(address);
        const ctx = source.chain as Parachain;
        const rcv = destination.chain as Parachain;

        const transferAssetLocation = getExtrinsicAssetLocation(
          locationOrError(ctx, asset),
          version
        );
        const transferAsset = toAsset(transferAssetLocation, amount);

        const dest = toDest(version, ctx, rcv);
        const beneficiary = toBeneficiary(version, account);
        const assets = {
          [version]: [transferAsset],
        };
        return [dest, beneficiary, assets, 0];
      },
    }),
});

const transferAssets = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'transferAssets',
      getArgs: async (func) => {
        const version = getExtrinsicArgumentVersion(func, 2);
        const account = getExtrinsicAccount(address);
        const ctx = source.chain as Parachain;
        const rcv = destination.chain as Parachain;

        const transferAssetLocation = getExtrinsicAssetLocation(
          locationOrError(ctx, asset),
          version
        );
        const transferAsset = toAsset(transferAssetLocation, amount);

        const dest = toDest(version, ctx, rcv);
        const beneficiary = toBeneficiary(version, account);
        const assets = {
          [version]: [transferAsset],
        };
        return [dest, beneficiary, assets, 0, 'Unlimited'];
      },
    }),
});

type TransferOpts = {
  transferType: XcmTransferType;
};

const transferAssetsUsingTypeAndThen = (
  opts: TransferOpts
): ExtrinsicConfigBuilder => ({
  build: ({ address, asset, amount, destination, messageId, sender, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'transferAssetsUsingTypeAndThen',
      getArgs: async () => {
        const version = XcmVersion.v4;

        const ctx = source.chain as Parachain;
        const rcv = destination.chain as Parachain;

        const from = getExtrinsicAccount(sender);
        const receiver = rcv.usesCexForwarding
          ? getDerivativeAccount(ctx, sender, rcv)
          : address;
        const account = getExtrinsicAccount(receiver);

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

        const dest = toDest(version, ctx, rcv);

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

        // Determine custom XCM based on destination and transfer type
        let customXcmOnDest;
        if (destination.chain.key === 'ethereum') {
          customXcmOnDest = toBridgeXcmOnDest(
            version,
            account,
            from,
            transferAssetLocation,
            messageId
          );
        } else {
          customXcmOnDest = toDepositXcmOnDest(version, account);
        }

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
          getArgs: async () => {
            const version = XcmVersion.v4;

            if (!transact) {
              throw new Error('Transact ctx configuration is missing.');
            }

            const ctx = source.chain as Parachain;
            const rcv = transact.chain as Parachain;
            const mda = getDerivativeAccount(ctx, sender, rcv);
            const account = getExtrinsicAccount(mda);

            const { fee } = transact;
            const transactFeeLocation = getExtrinsicAssetLocation(
              locationOrError(rcv, fee),
              version
            );
            const transactFeeAmount = big.toBigInt(opts.fee, fee.decimals);

            return [
              toDest(version, ctx, rcv),
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
    transferAsset: (opts: TransactOpts): ExtrinsicConfigBuilder => ({
      build: (params) => {
        const { amount, address, asset, sender, source, destination } = params;

        return new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: async () => {
            const version = XcmVersion.v4;

            const ctx = source.chain as Parachain;
            const rcv = destination.chain as Parachain;
            const mda = getDerivativeAccount(ctx, sender, rcv);
            const account = getExtrinsicAccount(mda);

            const receiver = getExtrinsicAccount(address);

            const transferAsset = getExtrinsicAssetLocation(
              locationOrError(rcv, asset),
              version
            );

            const { fee } = destination;

            const transferFeeAmount = big.toBigInt(opts.fee, fee.decimals);
            const transferAmount =
              amount > fee.amount
                ? amount - (fee.amount + transferFeeAmount)
                : amount;

            return [
              toDest(version, ctx, rcv),
              toTransferMessage(
                version,
                account,
                transferAsset,
                transferAmount,
                transferFeeAmount,
                receiver
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
    transferAssets,
    transferAssetsUsingTypeAndThen,
    send,
  };
};
