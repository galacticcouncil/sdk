import { Binary, PolkadotClient, TxEvent } from 'polkadot-api';

import { Subscription } from 'rxjs';

import { getSignerBySource } from './extension';

export async function signAndSend(
  source: string,
  address: string,
  client: PolkadotClient,
  calldata: Binary,
  observer: (value: TxEvent) => void
): Promise<Subscription> {
  const signer = await getSignerBySource(source, address);
  const api = client.getUnsafeApi();
  const tx = await api.txFromCallData(calldata);
  return tx.signSubmitAndWatch(signer).subscribe(observer);
}
