import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xcm2-core';
import { big } from '@galacticcouncil/common';

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
      getArgs: () => {
        const account = getExtrinsicAccount(address);
        const ctx = source.chain as Parachain;
        const rcv = destination.chain as Parachain;
        const version = rcv.xcmVersion;

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
          return {
            dest: toDest(version, ctx, rcv),
            beneficiary: toBeneficiary(version, account),
            assets: {
              [version]: [transferAsset],
            },
            fee_asset_item: 0,
            weight_limit: 'Unlimited',
          };
        }

        // Flip asset order if general index of asset greater than fee asset
        if (shouldFeeAssetPrecede(transferAssetLocation, transferFeeLocation)) {
          return {
            dest: toDest(version, ctx, rcv),
            beneficiary: toBeneficiary(version, account),
            assets: {
              [version]: [transferFee, transferAsset],
            },
            fee_asset_item: 0,
            weight_limit: 'Unlimited',
          };
        }

        return {
          dest: toDest(version, ctx, rcv),
          beneficiary: toBeneficiary(version, account),
          assets: {
            [version]: [transferAsset, transferFee],
          },
          fee_asset_item: 1,
          weight_limit: 'Unlimited',
        };
      },
    }),
});

const limitedTeleportAssets = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'limitedTeleportAssets',
      getArgs: () => {
        const account = getExtrinsicAccount(address);
        const ctx = source.chain as Parachain;
        const rcv = destination.chain as Parachain;
        const version = rcv.xcmVersion;

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
        return {
          dest,
          beneficiary,
          assets,
          fee_asset_item: 0,
          weight_limit: 'Unlimited',
        };
      },
    }),
});

const reserveTransferAssets = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'reserveTransferAssets',
      getArgs: () => {
        const account = getExtrinsicAccount(address);
        const ctx = source.chain as Parachain;
        const rcv = destination.chain as Parachain;
        const version = rcv.xcmVersion;

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
        return {
          dest,
          beneficiary,
          assets,
          fee_asset_item: 0,
        };
      },
    }),
});

const transferAssets = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'transferAssets',
      getArgs: () => {
        const account = getExtrinsicAccount(address);
        const ctx = source.chain as Parachain;
        const rcv = destination.chain as Parachain;
        const version = rcv.xcmVersion;

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
        return {
          dest,
          beneficiary,
          assets,
          fee_asset_item: 0,
          weight_limit: 'Unlimited',
        };
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

        return {
          dest,
          assets,
          assets_transfer_type: assetTransferType,
          remote_fees_id: remoteFeeId,
          fees_transfer_type: feesTransferType,
          custom_xcm_on_dest: customXcmOnDest,
          weight_limit: 'Unlimited',
        };
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

            return {
              dest: toDest(version, ctx, rcv),
              message: toTransactMessage(
                version,
                account,
                transactFeeLocation,
                transactFeeAmount,
                transact.call,
                transact.weight
              ),
            };
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

            const transferAmount =
              amount > fee.amount ? amount - fee.amount : amount;
            const transferFeeAmount = big.toBigInt(opts.fee, fee.decimals);

            return {
              dest: toDest(version, ctx, rcv),
              message: toTransferMessage(
                version,
                account,
                transferAsset,
                transferAmount,
                transferFeeAmount,
                receiver
              ),
            };
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
