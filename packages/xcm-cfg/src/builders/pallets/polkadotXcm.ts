import {
  XcmVersion,
  ExtrinsicConfigBuilder,
  ExtrinsicConfig,
  Parents,
} from '@moonbeam-network/xcm-builder';
import { toAssets, toBeneficiary, toDest } from './polkadotXcm.utils';
import { getExtrinsicAccount } from '../ExtrinsicBuilder.utils';

const pallet = 'polkadotXcm';

const limitedReserveTransferAssets = () => {
  const func = 'limitedReserveTransferAssets';
  return {
    X1: (): ExtrinsicConfigBuilder => ({
      build: ({ address, amount, asset, destination, palletInstance }) =>
        new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: () => {
            const version = XcmVersion.v1;
            const account = getExtrinsicAccount(address);
            return [
              toDest(version, destination),
              toBeneficiary(version, account),
              toAssets(version, 0, 'Here', amount),
              0,
              'Unlimited',
            ];
          },
        }),
    }),
    X2: (): ExtrinsicConfigBuilder => ({
      build: ({ address, amount, asset, destination, palletInstance }) =>
        new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: () => {
            const version = XcmVersion.v3;
            const account = getExtrinsicAccount(address);
            return [
              toDest(version, destination),
              toBeneficiary(version, account),
              toAssets(
                version,
                0,
                {
                  X2: [
                    {
                      PalletInstance: palletInstance,
                    },
                    {
                      GeneralIndex: asset,
                    },
                  ],
                },
                amount
              ),
              0,
              'Unlimited',
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
            return [
              toDest(version, destination),
              toBeneficiary(version, account),
              toAssets(version, 0, 'Here', amount),
              0,
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
            return [
              toDest(version, destination),
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

export const polkadotXcm = () => {
  return {
    limitedReserveTransferAssets,
    limitedTeleportAssets,
    reserveTransferAssets,
  };
};
