import { Parachain } from '@galacticcouncil/xcm-core';

import { XcmVersion } from '../../types';

export const toDest = (version: XcmVersion, destination: Parachain) => {
  return {
    [version]: {
      parents: 0,
      interior: {
        X1: [
          {
            Parachain: destination.parachainId,
          },
        ],
      },
    },
  };
};

export const toAsset = (assetLocation: object, amount: any) => {
  return {
    id: assetLocation,
    fun: {
      Fungible: amount,
    },
  };
};

export const toBeneficiary = (version: XcmVersion, account: any) => {
  return {
    [version]: {
      parents: 0,
      interior: {
        X1: [account],
      },
    },
  };
};
