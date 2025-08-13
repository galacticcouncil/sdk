import type { Call, SuiCall } from '@galacticcouncil/xcm-sdk';
import { AnyChain, SuiChain } from '@galacticcouncil/xcm-core';

import { Transaction } from '@mysten/sui/transactions';

export async function signAndSend(
  call: Call,
  chain: AnyChain,
  onTransactionSend: (hash: string | null) => void,
  onError: (error: unknown) => void
) {
  const ctx = chain as SuiChain;
  const { from, data } = call as SuiCall;

  const transaction = Transaction.from(data);

  const wallet = (window as any).phantom.sui;
  console.log(wallet);
  try {
    const params = {
      transaction: await transaction.toJSON(),
      address: from,
      networkID: 'SuiMainnet',
    };

    const signed = await wallet.signTransaction(params);

    const { transaction: txBytesB64, signature } = signed;
    const exec = await ctx.client.executeTransactionBlock({
      transactionBlock: txBytesB64,
      signature,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
        showBalanceChanges: true,
      },
    });
    onTransactionSend(exec.digest);
  } catch (err) {
    onError(err);
  }
}
