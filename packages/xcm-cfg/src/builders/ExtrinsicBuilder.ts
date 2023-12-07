import { polkadotXcm } from './pallets/polkadotXcm';
import { xcmPallet } from './pallets/xcmPallet';
import { xTokens } from './pallets/xTokens';

export function ExtrinsicBuilderV3() {
  return {
    xTokens,
    xcmPallet,
    polkadotXcm,
  };
}
