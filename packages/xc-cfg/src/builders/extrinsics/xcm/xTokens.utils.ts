import { Parachain } from '@galacticcouncil/xc-core';

import { XcmV3Junction, XcmV3Junctions } from '@galacticcouncil/descriptors';

import { XcmVersion } from './types';

export const toDest = (
  version: XcmVersion,
  destination: Parachain,
  account: any
) => {
  if (destination.parachainId === 0) {
    return {
      [version]: {
        parents: 1,
        interior: XcmV3Junctions.X1(account),
      },
    };
  }

  return {
    [version]: {
      parents: 1,
      interior: XcmV3Junctions.X2([
        XcmV3Junction.Parachain(destination.parachainId),
        account,
      ]),
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
