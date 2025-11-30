import { MessageV0, TransactionInstruction } from '@solana/web3.js';

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

export function chunkBySize(
  instructions: TransactionInstruction[],
  maxBytes = 1000
): TransactionInstruction[][] {
  const out: TransactionInstruction[][] = [];
  let cur: TransactionInstruction[] = [];
  let sz = 0;

  for (const ix of instructions) {
    const add = ix.data?.length ?? 0;
    if (cur.length && sz + add > maxBytes) {
      out.push(cur);
      cur = [];
      sz = 0;
    }
    cur.push(ix);
    sz += add;
  }
  if (cur.length) out.push(cur);
  return out;
}

export function serializeV0(mssgV0: MessageV0): string {
  const mssgArray = mssgV0.serialize();
  return Buffer.from(mssgArray).toString('hex');
}

export function deserializeV0(mssgV0: string): MessageV0 {
  const mssgBuffer = Buffer.from(mssgV0, 'hex');
  const mssgArray = Uint8Array.from(mssgBuffer);
  return MessageV0.deserialize(mssgArray);
}
