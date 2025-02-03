import { Asset } from '@galacticcouncil/xcm-core';

import { Call } from '../types';

export interface SubstrateCall extends Call {
  txOptions:
    | {
        asset: Asset | undefined;
      }
    | undefined;
}
