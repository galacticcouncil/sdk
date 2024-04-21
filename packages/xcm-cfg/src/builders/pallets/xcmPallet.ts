import { ExtrinsicConfigBuilderV2 } from '@galacticcouncil/xcm-core';
import {
  XcmVersion,
  ExtrinsicConfig,
  Parents,
} from '@moonbeam-network/xcm-builder';
import { toAssets, toBeneficiary, toDest } from './xcmPallet.utils';
import { getExtrinsicAccount } from '../ExtrinsicBuilder.utils';

const pallet = 'xcmPallet';

const limitedReserveTransferAssets = (parent: Parents) => {
  const func = 'limitedReserveTransferAssets';
  return {
    here: (): ExtrinsicConfigBuilderV2 => ({
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
              toAssets(version, parent, 'Here', amount),
              0,
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
    here: (): ExtrinsicConfigBuilderV2 => ({
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
              toAssets(version, parent, 'Here', amount),
              0,
              'Unlimited',
            ];
          },
        }),
    }),
  };
};

export const xcmPallet = () => {
  return {
    limitedReserveTransferAssets,
    limitedTeleportAssets,
  };
};
