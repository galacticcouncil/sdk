import {
  XcmV3Junctions,
  XcmV3Junction,
  XcmV3MultiassetFungibility,
} from '@galacticcouncil/descriptors';
import { Parachain } from '@galacticcouncil/xc-core';

import { XcmVersion } from './types';

export const toDest = (version: XcmVersion, destination: Parachain) => {
  return {
    type: version,
    value: {
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
    fun: XcmV3MultiassetFungibility.Fungible(amount),
  };
};

export const toBeneficiary = (version: XcmVersion, account: any) => {
  return {
    type: version,
    value: {
      parents: 0,
      interior: XcmV3Junctions.X1(account),
    },
  };
};
