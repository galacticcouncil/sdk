import { Keypair, TransactionError } from '@solana/web3.js';

import { Call, DryRunResult } from '../types';

export interface SolanaCall extends Call {
  ix: HumanizedIx[];
  signers: Keypair[];
}

export interface HumanizedIx {
  program: string;
  data: string;
  keys: string[];
}

export interface SolanaDryRunResult extends DryRunResult {
  error: TransactionError | null;
  events: string[] | null;
}
