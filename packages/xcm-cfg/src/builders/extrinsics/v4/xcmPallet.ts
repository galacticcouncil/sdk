import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xcm-core';
import { toAsset, toBeneficiary, toDest } from './xcmPallet.utils';
import { locationOrError } from './utils';

import {
  getExtrinsicAccount,
  getExtrinsicAssetLocation,
} from '../../ExtrinsicBuilder.utils';
import { XcmVersion } from '../../types';

const pallet = 'xcmPallet';

const limitedReserveTransferAssets = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, source }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'limitedReserveTransferAssets',
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

export const xcmPallet = () => {
  return {
    limitedReserveTransferAssets,
    limitedTeleportAssets,
  };
};
