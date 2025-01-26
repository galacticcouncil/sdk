import { XcmV3Junctions, XcmV3Junction } from '@polkadot-api/descriptors';

type XcmV3Multilocation = {
  parents: number;
  interior: XcmV3Junctions;
};

export const usdt = {
  parents: 0,
  interior: XcmV3Junctions.X2([
    XcmV3Junction.PalletInstance(50),
    XcmV3Junction.GeneralIndex(BigInt(1984)),
  ]),
} as XcmV3Multilocation;

export const usdc = {
  parents: 0,
  interior: XcmV3Junctions.X2([
    XcmV3Junction.PalletInstance(50),
    XcmV3Junction.GeneralIndex(BigInt(1337)),
  ]),
} as XcmV3Multilocation;
