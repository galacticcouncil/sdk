import { Parachain } from '@galacticcouncil/xc-core';

import { XcmVersion } from './types';

export const toDest = (version: XcmVersion, destination: Parachain) => {
  return {
    [version]: {
      parents: 0,
      interior: {
        type: 'X1',
        value: { type: 'Parachain', value: destination.parachainId },
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
        type: 'X1',
        value: { type: 'AccountId32', value: account },
      },
    },
  };
};
