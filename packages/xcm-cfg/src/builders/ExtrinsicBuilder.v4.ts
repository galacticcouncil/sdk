import { polkadotXcm } from './extrinsics/v4/polkadotXcm';
import { xcmPallet } from './extrinsics/v4/xcmPallet';
import { xTokens } from './extrinsics/v4/xTokens';

export function ExtrinsicBuilderV4() {
  return {
    polkadotXcm,
    xcmPallet,
    xTokens,
  };
}
