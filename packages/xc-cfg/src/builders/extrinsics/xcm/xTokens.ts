import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xc-core';

import { big, encodeAssetId } from '@galacticcouncil/common';
import { toAsset, toDest } from './xTokens.utils';

import {
  getDerivativeAccount,
  getExtrinsicAccount,
  getExtrinsicAssetLocation,
  locationOrError,
  shouldFeeAssetPrecede,
} from './utils';
import { XcmVersion } from './types';

const pallet = 'XTokens';

const transfer = (): ExtrinsicConfigBuilder => ({
  build: async ({ address, amount, asset, destination, sender, source }) => {
    const ctx = source.chain as Parachain;
    const rcv = destination.chain as Parachain;
    const version = XcmVersion.v3;

    const receiver = rcv.usesCexForwarding
      ? getDerivativeAccount(ctx, sender, rcv)
      : address;

    const account = getExtrinsicAccount(receiver);

    const assetId = ctx.getAssetId(asset);
    const encodedAssetId = encodeAssetId(assetId);

    const func = 'transfer';
    return new ExtrinsicConfig({
      module: pallet,
      func,
      getTx: (client) => {
        return client.getUnsafeApi().tx[pallet][func]({
          currency_id: encodedAssetId,
          amount,
          dest: toDest(version, rcv, account),
          dest_weight_limit: {
            type: 'Unlimited',
          },
        });
      },
    });
  },
});

const transferMultiasset = (): ExtrinsicConfigBuilder => ({
  build: async ({ address, amount, asset, destination, sender, source }) => {
    const ctx = source.chain as Parachain;
    const rcv = destination.chain as Parachain;
    const version = XcmVersion.v4;

    const receiver = rcv.usesCexForwarding
      ? getDerivativeAccount(ctx, sender, rcv)
      : address;

    const account = getExtrinsicAccount(receiver);

    const transferAssetLocation = getExtrinsicAssetLocation(
      locationOrError(ctx, asset),
      version
    );
    const transferAsset = toAsset(transferAssetLocation, amount);

    const func = 'transfer_multiasset';
    return new ExtrinsicConfig({
      module: pallet,
      func,
      getTx: (client) => {
        return client.getUnsafeApi().tx[pallet][func]({
          asset: {
            type: version,
            value: transferAsset,
          },
          dest: toDest(version, rcv, account),
          dest_weight_limit: {
            type: 'Unlimited',
          },
        });
      },
    });
  },
});

const transferMultiassets = (): ExtrinsicConfigBuilder => ({
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

    const func = 'transfer_multiassets';
    return new ExtrinsicConfig({
      module: pallet,
      func: 'transfer_multiassets',
      getTx: (client) => {
        const tx = client.getUnsafeApi().tx[pallet][func];

        if (asset.key === destination.fee.key) {
          return tx({
            assets: {
              type: version,
              value: [transferAsset],
            },
            fee_item: 0,
            dest: toDest(version, rcv, account),
            dest_weight_limit: {
              type: 'Unlimited',
            },
          });
        }

        // Flip asset order if general index of asset greater than fee asset
        if (shouldFeeAssetPrecede(transferAssetLocation, transferFeeLocation)) {
          return tx({
            assets: {
              type: version,
              value: [transferFee, transferAsset],
            },
            fee_item: 0,
            dest: toDest(version, rcv, account),
            dest_weight_limit: {
              type: 'Unlimited',
            },
          });
        }

        return tx({
          assets: {
            type: version,
            value: [transferAsset, transferFee],
          },
          fee_item: 1,
          dest: toDest(version, rcv, account),
          dest_weight_limit: {
            type: 'Unlimited',
          },
        });
      },
    });
  },
});

const transferMultiCurrencies = (): ExtrinsicConfigBuilder => ({
  build: async ({
    address,
    amount,
    asset,
    destination,
    sender,
    source,
    transact,
  }) => {
    const ctx = source.chain as Parachain;

    let rcv = destination.chain as Parachain;
    let feeAmount = destination.fee.amount;
    let feeAssetId = ctx.getAssetId(destination.fee);
    let receiver = address;

    if (transact) {
      rcv = transact.chain as Parachain;
      feeAmount = big.toBigInt(transact.fee.amount, transact.fee.decimals);
      feeAssetId = ctx.getAssetId(transact.fee);
      receiver = getDerivativeAccount(ctx, sender, rcv);
    }

    const version = XcmVersion.v4;
    const account = getExtrinsicAccount(receiver);
    const assetId = ctx.getAssetId(asset);
    const encodedAssetId = encodeAssetId(assetId);
    const encodedFeeAssetId = encodeAssetId(feeAssetId);

    const func = 'transfer_multicurrencies';
    return new ExtrinsicConfig({
      module: pallet,
      func,
      getTx: (client) => {
        return client.getUnsafeApi().tx[pallet][func]({
          currencies: [
            [encodedAssetId, amount],
            [encodedFeeAssetId, feeAmount],
          ],
          fee_item: 1,
          dest: toDest(version, rcv, account),
          dest_weight_limit: {
            type: 'Unlimited',
          },
        });
      },
    });
  },
});

export const xTokens = () => {
  return {
    transfer,
    transferMultiasset,
    transferMultiassets,
    transferMultiCurrencies,
  };
};
