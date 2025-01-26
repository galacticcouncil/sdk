import { Binary, TxEvent } from 'polkadot-api';

import { AnyChain, AnyParachain } from '@galacticcouncil/xcm-core';
import type { Call } from '@galacticcouncil/xcm-sdk';

import { assethub } from '@polkadot-api/descriptors';

import { getSignerBySource, getWs, asset } from './v2';

export async function signAndSend(
  address: string,
  call: Call,
  chain: AnyChain,
  observer: (value: TxEvent) => void
) {
  const ctx = chain as AnyParachain;
  const signer = await getSignerBySource('polkadot-js', address);

  const apiPjs = await ctx.api;
  const extrinsic = apiPjs.tx(call.data);

  const client = await getWs(ctx.ws);
  const api = client.getTypedApi(assethub);

  const callData = Binary.fromHex(extrinsic.inner.toHex());

  const tx = await api.txFromCallData(callData);
  tx.signSubmitAndWatch(signer, {
    asset: asset.usdc,
  }).subscribe(observer);
}
