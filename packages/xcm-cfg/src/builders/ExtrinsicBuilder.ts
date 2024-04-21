import { ethereumXcm } from './pallets/ethereumXcm';
import { polkadotXcm } from './pallets/polkadotXcm';
import { utility } from './pallets/utility';
import { xcmPallet } from './pallets/xcmPallet';
import { xTokens } from './pallets/xTokens';
import { xTransfer } from './pallets/xTransfer';

export function ExtrinsicBuilderV2() {
  return {
    ethereumXcm,
    polkadotXcm,
    utility,
    xTokens,
    xTransfer,
    xcmPallet,
  };
}
