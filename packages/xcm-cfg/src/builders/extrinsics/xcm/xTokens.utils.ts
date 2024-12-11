import { Parachain } from '@galacticcouncil/xcm-core';

import { getX1Junction } from './utils';
import { XcmVersion } from '../../types';

export const toDest = (
  version: XcmVersion,
  destination: Parachain,
  account: any
) => {
  if (destination.key === 'polkadot' || destination.key === 'kusama') {
    return {
      [version]: {
        parents: 1,
        interior: {
          X1: getX1Junction(version, account),
        },
      },
    };
  }

  return {
    [version]: {
      parents: 1,
      interior: {
        X2: [
          {
            Parachain: destination.parachainId,
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
      Fungible: amount,
    },
  };
};
