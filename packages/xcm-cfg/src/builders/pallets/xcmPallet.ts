import { XcmVersion, ExtrinsicConfigBuilder, ExtrinsicConfig } from '@moonbeam-network/xcm-builder';
import { toAssets, toBeneficiary, toDest } from './xcmPallet.utils';
import { getDestinationMultilocation } from '../ExtrinsicBuilder.utils';

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
            const multilocation = getDestinationMultilocation(address, destination);
            return [
              toDest(version, destination),
              toBeneficiary(version, multilocation),
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
