import type {
  Connection,
  RpcResponseAndContext,
  SendOptions,
  SignatureResult,
} from '@solana/web3.js';

import type { SignedTx } from '@wormhole-foundation/sdk-connect';

export async function sendTxWithRetry(
  rpc: Connection,
  tx: SignedTx,
  sendOpts: SendOptions = {},
  retryInterval = 5000
) {
  const commitment = sendOpts.preflightCommitment ?? rpc.commitment;
  const signature = await rpc.sendRawTransaction(tx, {
    ...sendOpts,
    skipPreflight: false, // The first send should not skip preflight to catch any errors
    maxRetries: 0,
    preflightCommitment: commitment,
  });
  // TODO: Use the lastValidBlockHeight that corresponds to the blockhash used in the transaction.
  const { blockhash, lastValidBlockHeight } = await rpc.getLatestBlockhash();
  const confirmTransactionPromise = rpc.confirmTransaction(
    {
      signature,
      blockhash,
      lastValidBlockHeight,
    },
    commitment
  );

  // This loop will break once the transaction has been confirmed or the block height is exceeded.
  // An exception will be thrown if the block height is exceeded by the confirmTransactionPromise.
  // The transaction will be resent if it hasn't been confirmed after the interval.

  let confirmedTx: RpcResponseAndContext<SignatureResult> | null = null;
  while (!confirmedTx) {
    confirmedTx = await Promise.race([
      confirmTransactionPromise,
      new Promise<null>((resolve) =>
        setTimeout(() => {
          resolve(null);
        }, retryInterval)
      ),
    ]);
    if (confirmedTx) {
      break;
    }
    await rpc.sendRawTransaction(tx, {
      ...sendOpts,
      skipPreflight: true,
      maxRetries: 0,
      preflightCommitment: commitment,
    });
  }
  return { signature, response: confirmedTx };
}
