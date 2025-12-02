import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xc-core';
import { toAsset, toBeneficiary, toDest } from './xcmPallet.utils';
import {
  toDepositXcmOnDest,
  toBridgeXcmOnDest,
  toTransferType,
} from './polkadotXcm.utils';

import {
  getDerivativeAccount,
  getExtrinsicAccount,
  getExtrinsicAssetLocation,
  locationOrError,
} from './utils';
import { XcmTransferType, XcmVersion } from './types';

const pallet = 'XcmPallet';

const limitedReserveTransferAssets = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'limited_reserve_transfer_assets',
      getArgs: async () => {
        const account = getExtrinsicAccount(address);

        const ctx = source.chain as Parachain;
        const rcv = destination.chain as Parachain;
        const version = XcmVersion.v4;

        const transferAssetLocation = getExtrinsicAssetLocation(
          locationOrError(ctx, asset),
          version
        );
        const transferAsset = toAsset(transferAssetLocation, amount);

        return {
          dest: toDest(version, rcv),
          beneficiary: toBeneficiary(version, account),
          assets: {
            type: version,
            value: [transferAsset],
          },
          fee_asset_item: 0,
          weight_limit: {
            type: 'Unlimited',
          },
        };
      },
    }),
});

const limitedTeleportAssets = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'limited_teleport_assets',
      getArgs: async () => {
        const account = getExtrinsicAccount(address);

        const ctx = source.chain as Parachain;
        const rcv = destination.chain as Parachain;
        const version = XcmVersion.v4;

        const transferAssetLocation = getExtrinsicAssetLocation(
          locationOrError(ctx, asset),
          version
        );
        const transferAsset = toAsset(transferAssetLocation, amount);

        return {
          dest: toDest(version, rcv),
          beneficiary: toBeneficiary(version, account),
          assets: {
            type: version,
            value: [transferAsset],
          },
          fee_asset_item: 0,
          weight_limit: {
            type: 'Unlimited',
          },
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
      func: 'transfer_assets_using_type_and_then',
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
          type: version,
          value: asset.isEqual(destination.fee)
            ? [transferAsset]
            : [transferFee, transferAsset],
        };

        const assetTransferType = toTransferType(
          version,
          transferType,
          transferAssetLocation
        );

        const remoteFeeId = {
          type: version,
          value: isSufficientPaymentAsset
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

        return {
          dest,
          assets,
          assets_transfer_type: assetTransferType,
          remote_fees_id: remoteFeeId,
          fees_transfer_type: feesTransferType,
          custom_xcm_on_dest: customXcmOnDest,
          weight_limit: {
            type: 'Unlimited',
          },
        };
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
