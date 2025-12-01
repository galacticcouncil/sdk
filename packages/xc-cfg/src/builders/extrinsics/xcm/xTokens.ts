import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xc-core';

import { big } from '@galacticcouncil/common';
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
  build: ({ address, amount, asset, destination, sender, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'transfer',
      getArgs: () => {
        const ctx = source.chain as Parachain;
        const rcv = destination.chain as Parachain;
        const version = XcmVersion.v4;

        const receiver = rcv.usesCexForwarding
          ? getDerivativeAccount(ctx, sender, rcv)
          : address;

        const account = getExtrinsicAccount(receiver);

        const assetId = ctx.getAssetId(asset);
        return {
          currency_id: assetId,
          amount,
          dest: toDest(version, rcv, account),
          dest_weight_limit: {
            type: 'Unlimited',
          },
        };
      },
    }),
});

const transferMultiasset = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, sender, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'transfer_multiasset',
      getArgs: () => {
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
        return {
          asset: {
            type: version,
            value: transferAsset,
          },
          dest: toDest(version, rcv, account),
          dest_weight_limit: {
            type: 'Unlimited',
          },
        };
      },
    }),
});

const transferMultiassets = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'transfer_multiassets',
      getArgs: () => {
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
        const transferFee = toAsset(
          transferFeeLocation,
          destination.fee.amount
        );

        if (asset.key === destination.fee.key) {
          return {
            assets: {
              type: version,
              value: [transferAsset],
            },
            fee_item: 0,
            dest: toDest(version, rcv, account),
            dest_weight_limit: {
            type: 'Unlimited',
          },
          };
        }

        // Flip asset order if general index of asset greater than fee asset
        if (shouldFeeAssetPrecede(transferAssetLocation, transferFeeLocation)) {
          return {
            assets: {
              type: version,
              value: [transferFee, transferAsset],
            },
            fee_item: 0,
            dest: toDest(version, rcv, account),
            dest_weight_limit: {
            type: 'Unlimited',
          },
          };
        }

        return {
          assets: {
            type: version,
            value: [transferAsset, transferFee],
          },
          fee_item: 1,
          dest: toDest(version, rcv, account),
          dest_weight_limit: {
            type: 'Unlimited',
          },
        };
      },
    }),
});

const transferMultiCurrencies = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, sender, source, transact }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'transfer_multicurrencies',
      getArgs: () => {
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
        return {
          currencies: [
            [assetId, amount],
            [feeAssetId, feeAmount],
          ],
          fee_item: 1,
          dest: toDest(version, rcv, account),
          dest_weight_limit: {
            type: 'Unlimited',
          },
        };
      },
    }),
});

export const xTokens = () => {
  return {
    transfer,
    transferMultiasset,
    transferMultiassets,
    transferMultiCurrencies,
  };
};
