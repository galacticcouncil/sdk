import {
  XcmVersion,
  ExtrinsicConfigBuilder,
  ExtrinsicConfig,
} from '@moonbeam-network/xcm-builder';
import { toAsset, toDest } from './xTokens.utils';
import {
  getDestinationMultilocation,
  getExtrinsicArgumentVersion,
} from '../ExtrinsicBuilder.utils';

const pallet = 'xTokens';

const transfer = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination }) =>
    new ExtrinsicConfig({
      module: pallet,
      func: 'transfer',
      getArgs: (func) => {
        const version = getExtrinsicArgumentVersion(func, 2);
        const multilocation = getDestinationMultilocation(address, destination);
        return [
          asset,
          amount,
          toDest(version, destination, multilocation),
          'Unlimited',
        ];
      },
    }),
});

const transferMultiasset = () => {
  return {
    X3: (): ExtrinsicConfigBuilder => ({
      build: ({ address, amount, asset, destination, palletInstance }) =>
        new ExtrinsicConfig({
          module: pallet,
          func: 'transferMultiasset',
          getArgs: () => {
            const version = XcmVersion.v3;
            const multilocation = getDestinationMultilocation(
              address,
              destination
            );
            return [
              toAsset(
                version,
                {
                  X3: [
                    {
                      Parachain: destination.parachainId,
                    },
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
              toDest(version, destination, multilocation),
              'Unlimited',
            ];
          },
        }),
    }),
  };
};

export const xTokens = () => {
  return {
    transfer,
    transferMultiasset,
  };
};
