import { Keypair } from '@solana/web3.js';

import { Call } from '../types';

export interface SolanaCall extends Call {
  ix: HumanizedIx[];
  signers: Keypair[];
}

export interface HumanizedIx {
  program: string;
  data: string;
  keys: string[];
}
