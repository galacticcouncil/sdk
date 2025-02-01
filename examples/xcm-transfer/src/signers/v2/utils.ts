import { XcmV3Junctions, XcmV3Junction } from '@polkadot-api/descriptors';

import { multiloc } from '@galacticcouncil/xcm-core';

import { XcmV3Multilocation } from './types';

export const getFeeAsset = (location: any) => {
  const pallet = multiloc.findPalletInstance(location);
  const index = multiloc.findGeneralIndex(location);

  return {
    parents: 0,
    interior: XcmV3Junctions.X2([
      XcmV3Junction.PalletInstance(Number(pallet)),
      XcmV3Junction.GeneralIndex(BigInt(index)),
    ]),
  } as XcmV3Multilocation;
};
