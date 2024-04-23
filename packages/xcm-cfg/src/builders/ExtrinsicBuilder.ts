import { ethereumXcm } from './extrinsics/ethereumXcm';
import { polkadotXcm } from './extrinsics/polkadotXcm';
import { utility } from './extrinsics/utility';
import { xcmPallet } from './extrinsics/xcmPallet';
import { xTokens } from './extrinsics/xTokens';
import { xTransfer } from './extrinsics/xTransfer';

export function ExtrinsicBuilder() {
  return {
    ethereumXcm,
    polkadotXcm,
    utility,
    xTokens,
    xTransfer,
    xcmPallet,
  };
}
