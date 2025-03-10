import { Call, DryRunResult } from '../types';

export interface EvmCall extends Call {
  /** Solidity JSON string ABI. */
  abi?: string;
  /** Spending CAP */
  allowance?: bigint;
  /** The address the transaction is directed to. */
  to: `0x${string}`;
  /** Value sent with this transaction. */
  value?: bigint;
}

export interface EvmEventLog {
  eventName: string;
  args: any[] | undefined;
}

export interface EvmDryRunResult extends DryRunResult {
  error: string | undefined;
  events: EvmEventLog[] | undefined;
}
