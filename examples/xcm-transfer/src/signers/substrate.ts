import { AnyChain, AnyParachain } from '@galacticcouncil/xcm-core';
import type { XCall } from '@galacticcouncil/xcm-sdk';
import type { ISubmittableResult } from '@polkadot/types/types';
import { getWalletBySource } from '@talismn/connect-wallets';

export async function signAndSend(
  address: string,
  call: XCall,
  chain: AnyChain,
  onStatusChange: (status: ISubmittableResult) => void,
  onError: (error: unknown) => void
) {
  const ctx = chain as AnyParachain;
  const api = await ctx.api;
  const extrinsic = api.tx(call.data);

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
