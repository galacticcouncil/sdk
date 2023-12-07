import { XcmVersion } from '@moonbeam-network/xcm-builder';
import { AnyChain } from '@moonbeam-network/xcm-types';

export const toDest = (version: XcmVersion, destination: AnyChain, multilocation: any) => {
  return {
    [version]: {
      parents: 1,
      interior: {
        X2: [
          {
            Parachain: destination.parachainId,
          },
          multilocation,
        ],
      },
    },
  };
};

export const toAsset = (version: XcmVersion, interior: any, amount: any) => {
  return {
    [version]: {
      id: {
        Concrete: {
          parents: 1,
          interior: interior,
        },
      },
      fun: {
        Fungible: amount,
      },
    },
  };
};
