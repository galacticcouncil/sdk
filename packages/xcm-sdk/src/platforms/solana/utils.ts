import { TransactionInstruction } from '@solana/web3.js';

import { HumanizedIx } from './types';

export function ixToHuman(
  instructions: TransactionInstruction[]
): HumanizedIx[] {
  return instructions.map((ix) => {
    return {
      program: ix.programId.toBase58(),
      data: ix.data.toString('hex'),
      keys: ix.keys.map((k) => k.pubkey.toBase58()),
    };
  });
}
