import { TxEvent } from 'polkadot-api';

import { tx } from '@galacticcouncil/sdk-next';

import { Subscription } from 'rxjs';

import { getSignerBySource } from './extension';

export async function signAndSend(
  source: string,
  address: string,
  transaction: tx.Transaction,
  observer: (value: TxEvent) => void
): Promise<Subscription> {
  const signer = await getSignerBySource(source, address);
  return transaction.signSubmitAndWatch(signer).subscribe(observer);
}
