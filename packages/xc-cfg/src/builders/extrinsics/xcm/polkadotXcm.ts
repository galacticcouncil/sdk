import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  ExtrinsicConfigBuilderParams,
  Parachain,
} from '@galacticcouncil/xc-core';
import { big } from '@galacticcouncil/common';

export type XcmMessageBuilder = (params: ExtrinsicConfigBuilderParams) => any;

import {
  isSnowbridgeTransfer,
  resolveBridgeRoute,
  toAsset,
  toBeneficiary,
  toBridgeXcmOnDest,
  toDepositXcmOnDest,
  toDest,
  toReserveXcmOnDest,
  toTransferType,
} from './polkadotXcm.utils';

import {
  getDerivativeAccount,
  getExtrinsicAccount,
  getExtrinsicAssetLocation,
  locationOrError,
  shouldFeeAssetPrecede,
} from './utils';
import { XcmTransferType, XcmVersion } from './types';

import { snowbridgeOutboundMessage } from './builder/Snowbridge';

const pallet = 'PolkadotXcm';

const limitedReserveTransferAssets = (): ExtrinsicConfigBuilder => ({
  build: async ({ address, amount, asset, destination, source }) => {
    const account = getExtrinsicAccount(address);
    const ctx = source.chain as Parachain;
    const rcv = destination.chain as Parachain;
    const version = XcmVersion.v4;

    const transferAssetRawLocation = locationOrError(ctx, asset);
    const transferFeeRawLocation = locationOrError(ctx, destination.fee);

    const transferAssetLocation = getExtrinsicAssetLocation(
      transferAssetRawLocation,
      version
    );
    const transferFeeLocation = getExtrinsicAssetLocation(
      transferFeeRawLocation,
      version
    );

    const transferAsset = toAsset(transferAssetLocation, amount);
    const transferFee = toAsset(transferFeeLocation, destination.fee.amount);

    const func = 'limited_reserve_transfer_assets';
    return new ExtrinsicConfig({
      module: pallet,
      func,
      getTx: (client) => {
        const tx = client.getUnsafeApi().tx[pallet][func];

        if (asset.key === destination.fee.key) {
          return tx({
            dest: toDest(version, ctx, rcv),
            beneficiary: toBeneficiary(version, account),
            assets: {
              type: version,
              value: [transferAsset],
            },
            fee_asset_item: 0,
            weight_limit: {
              type: 'Unlimited',
            },
          });
        }

        // Flip asset order if general index of asset greater than fee asset
        if (
          shouldFeeAssetPrecede(
            transferAssetRawLocation,
            transferFeeRawLocation
          )
        ) {
          return tx({
            dest: toDest(version, ctx, rcv),
            beneficiary: toBeneficiary(version, account),
            assets: {
              type: version,
              value: [transferFee, transferAsset],
            },
            fee_asset_item: 0,
            weight_limit: {
              type: 'Unlimited',
            },
          });
        }

        return tx({
          dest: toDest(version, ctx, rcv),
          beneficiary: toBeneficiary(version, account),
          assets: {
            type: version,
            value: [transferAsset, transferFee],
          },
          fee_asset_item: 1,
          weight_limit: {
            type: 'Unlimited',
          },
        });
      },
    });
  },
});

const limitedTeleportAssets = (): ExtrinsicConfigBuilder => ({
  build: async ({ address, amount, asset, destination, source }) => {
    const account = getExtrinsicAccount(address);
    const ctx = source.chain as Parachain;
    const rcv = destination.chain as Parachain;
    const version = XcmVersion.v4;

    const transferAssetLocation = getExtrinsicAssetLocation(
      locationOrError(ctx, asset),
      version
    );
    const transferAsset = toAsset(transferAssetLocation, amount);

    const dest = toDest(version, ctx, rcv);
    const beneficiary = toBeneficiary(version, account);
    const assets = {
      type: version,
      value: [transferAsset],
    };

    const func = 'limited_teleport_assets';
    return new ExtrinsicConfig({
      module: pallet,
      func,
      getTx: (client) => {
        return client.getUnsafeApi().tx[pallet][func]({
          dest,
          beneficiary,
          assets,
          fee_asset_item: 0,
          weight_limit: {
            type: 'Unlimited',
          },
        });
      },
    });
  },
});

const reserveTransferAssets = (): ExtrinsicConfigBuilder => ({
  build: async ({ address, amount, asset, destination, source }) => {
    const account = getExtrinsicAccount(address);
    const ctx = source.chain as Parachain;
    const rcv = destination.chain as Parachain;
    const version = ctx.xcmVersion ?? XcmVersion.v4;

    const transferAssetLocation = getExtrinsicAssetLocation(
      locationOrError(ctx, asset),
      version
    );
    const transferAsset = toAsset(transferAssetLocation, amount);

    const dest = toDest(version, ctx, rcv);
    const beneficiary = toBeneficiary(version, account);
    const assets = {
      type: version,
      value: [transferAsset],
    };

    const func = 'reserve_transfer_assets';
    return new ExtrinsicConfig({
      module: pallet,
      func,
      getTx: (client) => {
        return client.getUnsafeApi().tx[pallet][func]({
          dest,
          beneficiary,
          assets,
          fee_asset_item: 0,
        });
      },
    });
  },
});

const transferAssets = (): ExtrinsicConfigBuilder => ({
  build: async ({ address, amount, asset, destination, source }) => {
    const account = getExtrinsicAccount(address);
    const ctx = source.chain as Parachain;
    const rcv = destination.chain as Parachain;
    const version = XcmVersion.v4;

    const transferAssetLocation = getExtrinsicAssetLocation(
      locationOrError(ctx, asset),
      version
    );
    const transferAsset = toAsset(transferAssetLocation, amount);

    const dest = toDest(version, ctx, rcv);
    const beneficiary = toBeneficiary(version, account);
    const assets = {
      type: version,
      value: [transferAsset],
    };

    const func = 'transfer_assets';
    return new ExtrinsicConfig({
      module: pallet,
      func,
      getTx: (client) => {
        return client.getUnsafeApi().tx[pallet][func]({
          dest,
          beneficiary,
          assets,
          fee_asset_item: 0,
          weight_limit: {
            type: 'Unlimited',
          },
        });
      },
    });
  },
});

type TransferOpts = {
  transferType: XcmTransferType;
  executionFee?: number;
};

const transferAssetsUsingTypeAndThen = (
  opts: TransferOpts
): ExtrinsicConfigBuilder => ({
  build: async ({
    address,
    asset,
    amount,
    destination,
    messageId,
    sender,
    source,
  }) => {
    const version = XcmVersion.v4;

    const ctx = source.chain as Parachain;

    const rcv = destination.chain as Parachain;
    const feeAmount = destination.fee.amount;
    const feeAsset = destination.fee;

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
      locationOrError(ctx, feeAsset),
      version
    );

    const transferAsset = toAsset(transferAssetLocation, amount);
    const transferFee = toAsset(transferFeeLocation, feeAmount);

    const isSufficientPaymentAsset = asset.isEqual(feeAsset);

    const bridgeRoute = resolveBridgeRoute(version, ctx, rcv, asset);
    const dest = bridgeRoute?.dest ?? toDest(version, ctx, rcv);

    const assets = {
      type: version,
      value: isSufficientPaymentAsset
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

    let customXcmOnDest;
    if (
      isSnowbridgeTransfer(transferAssetLocation) &&
      destination.chain.isEvmChain()
    ) {
      customXcmOnDest = toBridgeXcmOnDest(
        version,
        account,
        from,
        transferAssetLocation,
        messageId
      );
    } else if (bridgeRoute) {
      const executionFeeAmount = big.toBigInt(
        opts.executionFee ?? destination.fee.amount,
        destination.fee.decimals
      );
      const destAssetLocation = getExtrinsicAssetLocation(
        locationOrError(rcv, asset),
        version
      );
      customXcmOnDest = toReserveXcmOnDest(
        version,
        account,
        rcv,
        bridgeRoute.mode,
        destAssetLocation,
        executionFeeAmount
      );
    } else {
      customXcmOnDest = toDepositXcmOnDest(
        version,
        account,
        assets.value.length
      );
    }

    const func = 'transfer_assets_using_type_and_then';
    return new ExtrinsicConfig({
      module: pallet,
      func,
      getTx: (client) => {
        return client.getUnsafeApi().tx[pallet][func]({
          dest,
          assets,
          assets_transfer_type: assetTransferType,
          remote_fees_id: remoteFeeId,
          fees_transfer_type: feesTransferType,
          custom_xcm_on_dest: customXcmOnDest,
          weight_limit: {
            type: 'Unlimited',
          },
        });
      },
    });
  },
});

function execute(messageBuilder: XcmMessageBuilder): ExtrinsicConfigBuilder;
function execute(): { viaSnowbridge: () => ExtrinsicConfigBuilder };
function execute(messageBuilder?: XcmMessageBuilder) {
  const buildExecute = (
    msgBuilder: XcmMessageBuilder
  ): ExtrinsicConfigBuilder => ({
    build: async (params) => {
      const message = msgBuilder(params);

      const func = 'execute';
      return new ExtrinsicConfig({
        module: pallet,
        func,
        getTx: (client) => {
          return client.getUnsafeApi().tx[pallet][func]({
            message,
            max_weight: {
              ref_time: 20_000_000_000n,
              proof_size: 500_000n,
            },
          });
        },
      });
    },
  });

  if (messageBuilder) {
    return buildExecute(messageBuilder);
  }

  return {
    viaSnowbridge: (): ExtrinsicConfigBuilder =>
      buildExecute(snowbridgeOutboundMessage),
  };
}

export const polkadotXcm = () => {
  return {
    limitedReserveTransferAssets,
    limitedTeleportAssets,
    reserveTransferAssets,
    transferAssets,
    transferAssetsUsingTypeAndThen,
    execute,
  };
};
