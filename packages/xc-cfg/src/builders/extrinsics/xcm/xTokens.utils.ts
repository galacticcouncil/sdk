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
        interior: {
          type: 'X1',
          value: { type: 'AccountId32', value: account },
        },
      },
    };
  }

  return {
    type: version,
    value: {
      parents: 1,
      interior: {
        type: 'X2',
        value: [
          {
            type: 'Parachain',
            value: destination.parachainId,
          },
          account,
        ],
      },
    },
  };
};

export const toAsset = (assetLocation: object, amount: any) => {
  return {
    id: assetLocation,
    fun: {
      type: 'Fungible',
      value: amount,
    },
  };
};
