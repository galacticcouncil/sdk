import { AssetAmount, BaseConfig, CallType } from '@galacticcouncil/xc-core';

export interface Platform<T extends BaseConfig> {
  /**
   * Ordered call sequence of a transfer.
   *
   * Takes the configs the route's builder produced, in execution order, and
   * returns one call per signature the sender has to give - which is not
   * one per config: a platform that can batch (substrate) collapses them,
   * one that can't (evm, solana) may also prepend account prerequisites.
   */
  buildCalls(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    configs: T[]
  ): Promise<Call[]>;
  estimateFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    configs: T[]
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
