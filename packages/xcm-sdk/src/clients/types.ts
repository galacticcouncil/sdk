import { AnyChain } from '@galacticcouncil/xcm-core';

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
}

export enum WhStatus {
  WaitingForVaa,
  VaaEmitted,
  Completed,
}
