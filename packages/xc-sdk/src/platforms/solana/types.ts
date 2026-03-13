import {
  Keypair,
  TransactionError,
  VersionedTransaction,
} from '@solana/web3.js';

import { Call, DryRunResult } from '../types';

export interface HumanizedIx {
  program: string;
  data: string;
  keys: string[];
}

export interface SolanaCall extends Call {
  ix: HumanizedIx[];
  signers: Keypair[];
}

export interface SolanaDryRunResult extends DryRunResult {
  error: TransactionError | null;
  events: string[] | null;
}

export interface SolanaWallet {
  connect(): Promise<void>;
  signAndSendTransaction(
    transaction: VersionedTransaction
  ): Promise<{ signature: string }>;
  signAllTransactions(
    transactions: VersionedTransaction[]
  ): Promise<VersionedTransaction[]>;
}

export interface SolanaTxObserver {
  onTransactionSend: (hash: string) => void;
  onStatus?: (status: any) => void;
  onBundleStatus?: (
    status: Array<{
      bundle_id: string;
      landed_slot: number;
      status: string;
    }>
  ) => void;
  onError: (error: unknown) => void;
}
