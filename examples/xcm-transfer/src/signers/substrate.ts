import { AnyChain, AnyParachain } from '@galacticcouncil/xcm-core';
import type { Call } from '@galacticcouncil/xcm-sdk';

import type { ApiPromise } from '@polkadot/api';
import type { ISubmittableResult } from '@polkadot/types/types';
import { getWalletBySource } from '@talismn/connect-wallets';

/**
 * Doesn't work in 14.x pjs !!!
 */
const feeAsset = (api: ApiPromise, assetId: number) =>
  api.createType('MultiLocation', {
    parents: 0,
    interior: {
      x2: [{ palletInstance: 50 }, { generalIndex: assetId }],
    },
  });

export async function signAndSend(
  address: string,
  call: Call,
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
