import { Keypair } from '@solana/web3.js';

import { XCall } from '../types';

export interface XCallSolana extends XCall {
  ix: HumanizedIx[];
  signers: Keypair[];
}

export interface HumanizedIx {
  program: string;
  data: string;
  keys: string[];
}
