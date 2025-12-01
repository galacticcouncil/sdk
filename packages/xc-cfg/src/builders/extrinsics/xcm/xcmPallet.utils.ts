import { Parachain } from '@galacticcouncil/xc-core';

import { XcmV3Junction, XcmV3Junctions } from '@galacticcouncil/descriptors';

import { XcmVersion } from './types';

export const toDest = (version: XcmVersion, destination: Parachain) => {
  return {
    [version]: {
      parents: 0,
      interior: XcmV3Junctions.X1(
        XcmV3Junction.Parachain(destination.parachainId)
      ),
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
      interior: XcmV3Junctions.X1(account),
    },
  };
};
