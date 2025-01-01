import type { XCall, XCallSolana } from '@galacticcouncil/xcm-sdk';
import { AnyChain, SolanaChain } from '@galacticcouncil/xcm-core';

import { MessageV0, VersionedTransaction } from '@solana/web3.js';

export async function signAndSend(
  call: XCall,
  chain: AnyChain,
  onTransactionSend: (hash: string | null) => void,
  onError: (error: unknown) => void
) {
  const ctx = chain as SolanaChain;
  const { data, signers } = call as XCallSolana;

  const mssgBuffer = Buffer.from(data, 'hex');
  const mssgArray = Uint8Array.from(mssgBuffer);
  const mssgV0 = MessageV0.deserialize(mssgArray);

  const versioned = new VersionedTransaction(mssgV0);

  const solana = (window as any).solana;
  try {
    await solana.connect();
    versioned.sign(signers);
    const { signature } = await solana.signAndSendTransaction(versioned);
    onTransactionSend(signature);
    await ctx.connection.getSignatureStatus(signature);
  } catch (err) {
    onError(err);
  }
}
