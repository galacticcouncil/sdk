import { polkadotXcm } from './extrinsics/v4/polkadotXcm';
import { xTokens } from './extrinsics/v4/xTokens';

export function ExtrinsicBuilderV4() {
  return {
    polkadotXcm,
    xTokens,
  };
}
