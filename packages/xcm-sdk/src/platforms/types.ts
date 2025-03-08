import {
  Asset,
  AssetAmount,
  BaseConfig,
  CallType,
} from '@galacticcouncil/xcm-core';

import { Observable } from 'rxjs';

export interface Platform<T extends BaseConfig, B extends BaseConfig> {
  buildCall(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: T
  ): Promise<Call>;
  estimateFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: T
  ): Promise<AssetAmount>;
  getBalance(asset: Asset, config: B): Promise<AssetAmount>;
  subscribeBalance(asset: Asset, config: B): Promise<Observable<AssetAmount>>;
}

export interface Call {
  /** Owner of transation. */
  from: string;
  /** Hex-encoded call data. */
  data: string;
  /** Calltype. */
  type: CallType;
  /**
   * Simulate call execution
   */
  dryRun(): Promise<DryRunResult | undefined>;
}

export interface DryRunResult {
  error: any | undefined;
  events: any | undefined;
}
