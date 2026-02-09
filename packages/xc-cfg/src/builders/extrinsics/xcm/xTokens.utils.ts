import { XcmV3Junctions, XcmV3Junction } from '@galacticcouncil/descriptors';
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
