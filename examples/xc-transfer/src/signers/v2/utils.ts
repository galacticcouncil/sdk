import { XcmV3Junctions, XcmV3Junction } from '@galacticcouncil/descriptors';

import { AnyParachain, Asset, multiloc } from '@galacticcouncil/xc-core';

import { XcmV3Multilocation } from './types';

export const getFeeAsset = (chain: AnyParachain, asset: Asset) => {
  const location = chain.getAssetXcmLocation(asset);
  if (location) {
    const pallet = multiloc.findPalletInstance(location);
    const index = multiloc.findGeneralIndex(location);

    return {
      parents: 0,
      interior: XcmV3Junctions.X2([
        XcmV3Junction.PalletInstance(Number(pallet)),
        XcmV3Junction.GeneralIndex(BigInt(index)),
      ]),
    } as XcmV3Multilocation;
  }
  throw new Error('Asset locations not found');
};
