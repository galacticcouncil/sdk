import { polkadotXcm } from './extrinsics/v4/polkadotXcm';
import { xcmPallet } from './extrinsics/v4/xcmPallet';
import { xTokens } from './extrinsics/v4/xTokens';
import { xTransfer } from './extrinsics/v4/xTransfer';

export function ExtrinsicBuilderV4() {
  return {
    polkadotXcm,
    xcmPallet,
    xTokens,
    xTransfer,
  };
}
