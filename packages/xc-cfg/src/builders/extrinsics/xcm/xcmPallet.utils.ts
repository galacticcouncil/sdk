import { Parachain } from '@galacticcouncil/xc-core';

import { getX1Junction } from './utils';
import { XcmVersion } from './types';

export const toDest = (version: XcmVersion, destination: Parachain) => {
  const toParachain = {
    Parachain: destination.parachainId,
  };

  return {
    [version]: {
      parents: 0,
      interior: {
        X1: getX1Junction(version, toParachain),
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
        X1: getX1Junction(version, account),
      },
    },
  };
};
