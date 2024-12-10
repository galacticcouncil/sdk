import {
  acc,
  big,
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { toAsset, toDest } from './xTokens.utils';
import { locationOrError, shouldFeeAssetPrecede } from './utils';

import {
  getExtrinsicAccount,
  getExtrinsicAssetLocation,
} from '../../ExtrinsicBuilder.utils';
import { XcmVersion } from '../../types';

const pallet = 'xTokens';

const transfer = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'transfer',
      getArgs: () => {
        const version = XcmVersion.v4;
        const account = getExtrinsicAccount(address);
        const ctx = source.chain as Parachain;
        const rcv = destination.chain as Parachain;
        const assetId = ctx.getAssetId(asset);
        return [assetId, amount, toDest(version, rcv, account), 'Unlimited'];
      },
    }),
});

const transferMultiasset = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'transferMultiasset',
      getArgs: () => {
        const version = XcmVersion.v4;
        const account = getExtrinsicAccount(address);
        const ctx = source.chain as Parachain;
        const rcv = destination.chain as Parachain;

        const transferAssetLocation = getExtrinsicAssetLocation(
          locationOrError(ctx, asset),
          version
        );
        const transferAsset = toAsset(transferAssetLocation, amount);
        return [
          {
            [version]: transferAsset,
          },
          toDest(version, rcv, account),
          'Unlimited',
        ];
      },
    }),
});

const transferMultiassets = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'transferMultiassets',
      getArgs: () => {
        const version = XcmVersion.v4;
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
            {
              [version]: [transferAsset],
            },
            0,
            toDest(version, rcv, account),
            'Unlimited',
          ];
        }

        // Flip asset order if general index of asset greater than fee asset
        if (shouldFeeAssetPrecede(transferAssetLocation, transferFeeLocation)) {
          return [
            {
              [version]: [transferFee, transferAsset],
            },
            0,
            toDest(version, rcv, account),
            'Unlimited',
          ];
        }

        return [
          {
            [version]: [transferAsset, transferFee],
          },
          1,
          toDest(version, rcv, account),
          'Unlimited',
        ];
      },
    }),
});

const transferMultiCurrencies = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, sender, source, transact }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'transferMulticurrencies',
      getArgs: () => {
        const version = XcmVersion.v4;
        const ctx = source.chain as Parachain;

        let rcv = destination.chain as Parachain;
        let feeAmount = destination.fee.amount;
        let feeAssetId = ctx.getAssetId(destination.fee);
        let receiver = address;

        if (transact) {
          rcv = transact.chain as Parachain;
          feeAmount = big.toBigInt(transact.fee.amount, transact.fee.decimals);
          feeAssetId = ctx.getAssetId(transact.fee);
          receiver = acc.getMultilocationDerivatedAccount(
            ctx.parachainId,
            sender,
            1
          );
        }

        const account = getExtrinsicAccount(receiver);
        const assetId = ctx.getAssetId(asset);
        return [
          [
            [assetId, amount],
            [feeAssetId, feeAmount],
          ],
          1,
          toDest(version, rcv, account),
          'Unlimited',
        ];
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
