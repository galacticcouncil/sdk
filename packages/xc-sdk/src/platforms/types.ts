import { AssetAmount, BaseConfig, CallType } from '@galacticcouncil/xc-core';

export interface Platform<T extends BaseConfig> {
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
  call: string;
  error: any | undefined;
  events: any | undefined;
}
