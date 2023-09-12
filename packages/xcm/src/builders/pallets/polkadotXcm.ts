import { XcmVersion, ExtrinsicConfigBuilder, ExtrinsicConfig } from '@moonbeam-network/xcm-builder';
import { toAssets, toBeneficiary, toDest } from './polkadotXcm.utils';
import { getDestinationMultilocation } from '../ExtrinsicBuilder.utils';

const pallet = 'polkadotXcm';

const limitedReserveTransferAssets = () => {
  const func = 'limitedReserveTransferAssets';
  return {
    X2: (): ExtrinsicConfigBuilder => ({
      build: ({ address, amount, asset, destination, palletInstance }) =>
        new ExtrinsicConfig({
          module: pallet,
          func,
          getArgs: () => {
            const version = XcmVersion.v3;
            const multilocation = getDestinationMultilocation(address, destination);
            return [
              toDest(version, destination),
              toBeneficiary(version, multilocation),
              toAssets(
                version,
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
            const multilocation = getDestinationMultilocation(address, destination);
            return [
              toDest(version, destination),
              toBeneficiary(version, multilocation),
              toAssets(version, 'Here', amount),
              0,
            ];
          },
        }),
    }),
  };
};

export const polkadotXcm = () => {
  return {
    limitedReserveTransferAssets,
    reserveTransferAssets,
  };
};
