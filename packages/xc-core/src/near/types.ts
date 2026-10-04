export interface NearAccountView {
  /** Liquid balance, yocto - including what is staked for storage. */
  amount: string;
  /** Validator stake, yocto. */
  locked: string;
  /** Bytes the account occupies, each staked at {@link NEAR_STORAGE_BYTE_COST}. */
  storage_usage: number;
}

export interface NearAccessKeyView {
  nonce: number;
  block_hash: string;
}

/** One contract storage entry, raw. */
export interface NearStateItem {
  key: Uint8Array;
  value: Uint8Array;
}

export type NearExecutionStatus =
  | { SuccessValue: string }
  | { SuccessReceiptId: string }
  | { Failure: unknown }
  | 'Unknown'
  | 'Pending';

export interface NearExecutionOutcome {
  id: string;
  outcome: {
    executor_id: string;
    gas_burnt: number;
    logs: string[];
    status: NearExecutionStatus;
    tokens_burnt: string;
  };
}

/**
 * Final execution outcome of a transaction.
 *
 * - `status` is the outcome of the transaction's last receipt
 * - A receipt elsewhere in the tree can fail while `status` succeeds
 */
export interface NearTxOutcome {
  status: NearExecutionStatus;
  transaction: {
    hash: string;
    receiver_id: string;
    signer_id: string;
  };
  transaction_outcome: NearExecutionOutcome;
  receipts_outcome: NearExecutionOutcome[];
}
