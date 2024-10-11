import {
  big,
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xcm-core';
import {
  toAsset,
  toAssets,
  toBeneficiary,
  toDest,
  toTransactMessage,
} from './polkadotXcm.utils';
import {
  getExtrinsicAccount,
  getExtrinsicArgumentVersion,
  getDerivatedAccount,
  Parents,
  XcmVersion,
} from '../ExtrinsicBuilder.utils';

const pallet = 'polkadotXcm';

const limitedReserveTransferAssets = () => {
  const func = 'limitedReserveTransferAssets';
  return {
    here: (): ExtrinsicConfigBuilder => ({
      build: ({ address, amount, destination }) =>
        new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: (ext) => {
            const version = getExtrinsicArgumentVersion(ext);
            const account = getExtrinsicAccount(address);
            const rcv = destination.chain as Parachain;
            return [
              toDest(version, rcv),
              toBeneficiary(version, account),
              toAssets(version, 0, 'Here', amount),
              0,
              'Unlimited',
            ];
          },
        }),
    }),
    X2: (): ExtrinsicConfigBuilder => ({
      build: ({ address, amount, asset, destination, source }) =>
        new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: () => {
            const version = XcmVersion.v3;
            const account = getExtrinsicAccount(address);
            const ctx = source.chain as Parachain;
            const rcv = destination.chain as Parachain;
            const assetId = ctx.getAssetId(asset);
            const palletInstance = ctx.getAssetPalletInstance(asset);
            const assets = [
              toAsset(
                0,
                {
                  X2: [
                    {
                      PalletInstance: palletInstance,
                    },
                    {
                      GeneralIndex: assetId,
                    },
                  ],
                },
                amount
              ),
            ];

            if (asset.key === destination.fee.key) {
              return [
                toDest(version, rcv),
                toBeneficiary(version, account),
                {
                  [version]: assets,
                },
                0,
                'Unlimited',
              ];
            }

            const feeAssetId = ctx.getAssetId(destination.fee);
            assets.push(
              toAsset(
                0,
                {
                  X2: [
                    {
                      PalletInstance: palletInstance,
                    },
                    {
                      GeneralIndex: feeAssetId,
                    },
                  ],
                },
                destination.fee.amount
              )
            );

            // Flip asset order if general index greater than fee asset
            if (Number(assetId) > Number(feeAssetId)) {
              return [
                toDest(version, rcv),
                toBeneficiary(version, account),
                {
                  [version]: assets.reverse(),
                },
                0,
                'Unlimited',
              ];
            }

            return [
              toDest(version, rcv),
              toBeneficiary(version, account),
              {
                [version]: assets,
              },
              1,
              'Unlimited',
            ];
          },
        }),
    }),
  };
};

const limitedTeleportAssets = (parent: Parents) => {
  const func = 'limitedTeleportAssets';
  return {
    here: (): ExtrinsicConfigBuilder => ({
      build: ({ address, amount, destination }) =>
        new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: () => {
            const version = XcmVersion.v2;
            const account = getExtrinsicAccount(address);
            const rcv = destination.chain as Parachain;
            return [
              toDest(version, rcv),
              toBeneficiary(version, account),
              toAssets(version, parent, 'Here', amount),
              0,
              'Unlimited',
            ];
          },
        }),
    }),
  };
};

const teleportAssets = (parent: Parents) => {
  const func = 'teleportAssets';
  return {
    here: (): ExtrinsicConfigBuilder => ({
      build: ({ address, amount, destination }) =>
        new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: () => {
            const version = XcmVersion.v3;
            const account = getExtrinsicAccount(address);
            const rcv = destination.chain as Parachain;
            return [
              toDest(version, rcv),
              toBeneficiary(version, account),
              toAssets(version, parent, 'Here', amount),
              0,
            ];
          },
        }),
    }),
  };
};

const reserveTransferAssets = () => {
  const func = 'reserveTransferAssets';
  return {
    here: (): ExtrinsicConfigBuilder => ({
      build: ({ address, amount, destination }) =>
        new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: () => {
            const version = XcmVersion.v3;
            const account = getExtrinsicAccount(address);
            const rcv = destination.chain as Parachain;
            return [
              toDest(version, rcv),
              toBeneficiary(version, account),
              toAssets(version, 0, 'Here', amount),
              0,
            ];
          },
        }),
    }),
  };
};

type TransactOpts = {
  fee: number;
};

const send = () => {
  const func = 'send';
  return {
    transact: (opts: TransactOpts): ExtrinsicConfigBuilder => ({
      build: (params) => {
        const { destination, source, via } = params;
        return new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: () => {
            if (via && via.fee && via.transact) {
              const version = XcmVersion.v3;
              const derivatedAccount = getDerivatedAccount(params);
              const account = getExtrinsicAccount(derivatedAccount);
              const ctx = source.chain as Parachain;
              const rcv = destination.chain as Parachain;

              const { fee, transact } = via;
              const feePalletInstance = ctx.getAssetPalletInstance(fee);
              const feeAmount = big.toBigInt(opts.fee, fee.decimals);

              return [
                toDest(version, via.chain || rcv),
                toTransactMessage(
                  version,
                  account,
                  { X1: { PalletInstance: feePalletInstance } },
                  transact.call,
                  transact.weight,
                  feeAmount
                ),
              ];
            }
            throw new Error(
              'Route via configuration is incorrect. Specify transact & fee configs.'
            );
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
    teleportAssets,
    send,
  };
};
