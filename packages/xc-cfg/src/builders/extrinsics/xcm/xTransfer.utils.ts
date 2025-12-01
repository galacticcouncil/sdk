import { Parachain } from '@galacticcouncil/xc-core';

import { XcmV3Junction, XcmV3Junctions } from '@galacticcouncil/descriptors';

export const toDest = (destination: Parachain, account: any) => {
  return {
    parents: 1,
    interior: XcmV3Junctions.X2([
      XcmV3Junction.Parachain(destination.parachainId),
      account,
    ]),
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
