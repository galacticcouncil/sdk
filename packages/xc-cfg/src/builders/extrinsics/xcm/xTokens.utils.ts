import {
  XcmV3Junctions,
  XcmV3Junction,
  XcmV3MultiassetFungibility,
} from '@galacticcouncil/descriptors';
import { Parachain } from '@galacticcouncil/xc-core';

import { XcmVersion } from './types';

export const toDest = (
  version: XcmVersion,
  destination: Parachain,
  account: any
) => {
  if (destination.parachainId === 0) {
    return {
      type: version,
      value: {
        parents: 1,
        interior: XcmV3Junctions.X1(account),
      },
    };
  }

  return {
    type: version,
    value: {
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
    fun: XcmV3MultiassetFungibility.Fungible(amount),
  };
};
