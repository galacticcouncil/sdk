import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xcm-core';
import { toAsset, toBeneficiary, toDest } from './xcmPallet.utils';
import {
  toDepositXcmOnDest,
  toBridgeXcmOnDest,
  toTransferType,
} from './polkadotXcm.utils';

import {
  getDerivativeAccount,
  getExtrinsicAccount,
  getExtrinsicArgumentVersion,
  getExtrinsicAssetLocation,
  locationOrError,
} from './utils';
import { XcmTransferType, XcmVersion } from './types';

const pallet = 'xcmPallet';

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
        const transferAsset = toAsset(transferAssetLocation, amount);

        return [
          toDest(version, rcv),
          toBeneficiary(version, account),
          {
            [version]: [transferAsset],
          },
          0,
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

        return [
          toDest(version, rcv),
          toBeneficiary(version, account),
          {
            [version]: [transferAsset],
          },
          0,
          'Unlimited',
        ];
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

        const customXcmOnDest = (() => {
          if (destination.chain.key === 'ethereum') {
            return toBridgeXcmOnDest(
              version,
              account,
              from,
              transferAssetLocation,
              messageId
            );
          } else {
            return toDepositXcmOnDest(version, account);
          }
        })();

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

export const xcmPallet = () => {
  return {
    limitedReserveTransferAssets,
    limitedTeleportAssets,
    transferAssetsUsingTypeAndThen,
  };
};
