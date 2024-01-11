import {
  XcmVersion,
  ExtrinsicConfigBuilder,
  ExtrinsicConfig,
} from '@moonbeam-network/xcm-builder';
import { toAssets, toBeneficiary, toDest } from './xcmPallet.utils';
import { getExtrinsicAccount } from '../ExtrinsicBuilder.utils';

const pallet = 'xcmPallet';

const limitedReserveTransferAssets = () => {
  const func = 'limitedReserveTransferAssets';
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
              toAssets(version, amount),
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
  };
};
