import { XCall } from '../types';

export interface XCallEvm extends XCall {
  /** Solidity JSON string ABI. */
  abi?: string;
  /** Spending CAP */
  allowance?: bigint;
  /** The address the transaction is directed to. */
  to: `0x${string}`;
  /** Value sent with this transaction. */
  value?: bigint;
}
