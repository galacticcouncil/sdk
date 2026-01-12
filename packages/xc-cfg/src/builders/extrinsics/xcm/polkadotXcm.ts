import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xc-core';
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

const pallet = 'PolkadotXcm';

const limitedReserveTransferAssets = (): ExtrinsicConfigBuilder => ({
  build: async ({ address, amount, asset, destination, source }) => {
    const account = getExtrinsicAccount(address);
    const ctx = source.chain as Parachain;
    const rcv = destination.chain as Parachain;
    const version = XcmVersion.v4;

    const transferAssetLocation = getExtrinsicAssetLocation(
      locationOrError(ctx, asset),
      version
    );
    const transferFeeLocation = getExtrinsicAssetLocation(
      locationOrError(ctx, destination.fee),
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
        if (shouldFeeAssetPrecede(transferAssetLocation, transferFeeLocation)) {
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
    transact,
  }) => {
    const version = XcmVersion.v4;

    const ctx = source.chain as Parachain;

    let rcv = destination.chain as Parachain;
    let feeAmount: bigint = destination.fee.amount;
    let feeAsset = destination.fee;

    if (transact) {
      rcv = transact.chain as Parachain;
      feeAmount = big.toBigInt(transact.fee.amount, transact.fee.decimals);
      feeAsset = transact.fee;
    }

    const from = getExtrinsicAccount(sender);
    const receiver =
      transact || rcv.usesCexForwarding
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

    const dest = toDest(version, ctx, rcv);

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
    if (destination.chain.key === 'ethereum') {
      customXcmOnDest = toBridgeXcmOnDest(
        version,
        account,
        from,
        transferAssetLocation,
        messageId
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

type TransactOpts = {
  fee: number;
};

const send = () => {
  const func = 'send';
  return {
    transact: (opts: TransactOpts): ExtrinsicConfigBuilder => ({
      build: async (params) => {
        const { sender, source, transact } = params;

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

        return new ExtrinsicConfig({
          module: pallet,
          func,
          getTx: (client) => {
            return client.getUnsafeApi().tx[pallet][func]({
              dest: toDest(version, ctx, rcv),
              message: toTransactMessage(
                version,
                account,
                transactFeeLocation,
                transactFeeAmount,
                transact.call,
                transact.weight
              ),
            });
          },
        });
      },
    }),
    transferAsset: (opts: TransactOpts): ExtrinsicConfigBuilder => ({
      build: async (params) => {
        const { amount, address, asset, sender, source, destination } = params;

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

        return new ExtrinsicConfig({
          module: pallet,
          func,
          getTx: (client) => {
            return client.getUnsafeApi().tx[pallet][func]({
              dest: toDest(version, ctx, rcv),
              message: toTransferMessage(
                version,
                account,
                transferAsset,
                transferAmount,
                transferFeeAmount,
                receiver
              ),
            });
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
