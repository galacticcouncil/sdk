import { Asset } from '@galacticcouncil/xcm2-core';

import { Call, DryRunResult } from '../types';

export interface SubstrateCall extends Call {
  txOptions:
    | {
        asset: Asset | undefined;
      }
    | undefined;
}

export interface SubstrateDryRunResult extends DryRunResult {
  error: string | undefined;
  events: any | undefined;
  xcm: any | undefined;
}
