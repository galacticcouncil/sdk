import { XcmVersion } from '@moonbeam-network/xcm-builder';
import { AnyChain } from '@moonbeam-network/xcm-types';

export const toDest = (version: XcmVersion, destination: AnyChain) => {
  return {
    [version]: {
      parents: 0,
      interior: {
        X1: { Parachain: destination.parachainId },
      },
    },
  };
};

export const toBeneficiary = (version: XcmVersion, multilocation: any) => {
  return {
    [version]: {
      parents: 0,
      interior: {
        X1: multilocation,
      },
    },
  };
};

export const toAssets = (version: XcmVersion, amount: any) => {
  return {
    [version]: [
      {
        id: {
          Concrete: {
            parents: 0,
            interior: 'Here',
          },
        },
        fun: {
          Fungible: amount,
        },
      },
    ],
  };
};
