import { ApiPromise } from '@polkadot/api';
import { ISubmittableResult } from '@polkadot/types/types';

import { getWalletBySource } from '@talismn/connect-wallets';

export async function signAndSend(
  address: string,
  call: string,
  api: ApiPromise,
  onStatusChange: (status: ISubmittableResult) => void,
  onError: (error: unknown) => void
) {
  const extrinsic = api.tx(call);

  const wallet = getWalletBySource('polkadot-js');
  if (!wallet) {
    throw new Error('No polkadot-js wallet found!');
  }
  await wallet.enable('xcm-transfer');
  const nextNonce = await api.rpc.system.accountNextIndex(address);

  extrinsic
    .signAndSend(
      address,
      { signer: wallet.signer, nonce: nextNonce },
      onStatusChange
    )
    .catch((error: any) => {
      onError(error);
    });
}
