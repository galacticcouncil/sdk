import { Asset } from '@galacticcouncil/xc-core';

import { TxEvent } from 'polkadot-api';

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

export interface SubstrateTxObserver {
  onTransactionSend: (hash: string) => void;
  onFinalized: (event: TxEvent) => void;
  onError: (error: unknown) => void;
}
