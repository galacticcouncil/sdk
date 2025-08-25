import { AnyChain } from '@galacticcouncil/xcm-core';

import { Operation } from './WormholeScan';
import { Call } from '../platforms';

export interface WhTransfer {
  asset: string;
  assetSymbol: string;
  amount: string;
  from: string;
  fromChain: AnyChain;
  to: string;
  toChain: AnyChain;
  status: WhStatus;
  redeem?: (from: string) => Call;
  operation: Operation;
}

export enum WhStatus {
  WaitingForVaa,
  VaaEmitted,
  Completed,
}
