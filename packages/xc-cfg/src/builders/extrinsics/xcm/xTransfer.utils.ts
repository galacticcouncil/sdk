import {
  XcmV3Junctions,
  XcmV3Junction,
  XcmV3MultiassetFungibility,
} from '@galacticcouncil/descriptors';
import { Parachain } from '@galacticcouncil/xc-core';

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
    fun: XcmV3MultiassetFungibility.Fungible(amount),
  };
};
