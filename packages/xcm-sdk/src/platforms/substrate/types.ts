import { Asset } from '@galacticcouncil/xcm-core';
import { AnyJson } from '@polkadot/types/types';

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
  events: AnyJson | undefined;
}
