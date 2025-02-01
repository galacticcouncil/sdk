import { Binary, TxEvent } from 'polkadot-api';

import { assethub } from '@polkadot-api/descriptors';

import type { AnyChain, AnyParachain } from '@galacticcouncil/xcm-core';
import type { Call, SubstrateCall } from '@galacticcouncil/xcm-sdk';

import { getSignerBySource, getWs, getFeeAsset } from './v2';

export async function signAndSend(
  address: string,
  call: Call,
  chain: AnyChain,
  observer: (value: TxEvent) => void
) {
  const ctx = chain as AnyParachain;
  const signer = await getSignerBySource('polkadot-js', address);

  const { data, txOptions } = call as SubstrateCall;

  const apiPjs = await ctx.api;
  const extrinsic = apiPjs.tx(data);

  console.log(extrinsic.toHuman());

  const client = await getWs(ctx.ws);
  const api = client.getTypedApi(assethub);

  const callData = Binary.fromHex(extrinsic.inner.toHex());
  const asset = getFeeAsset(txOptions?.asset);

  const tx = await api.txFromCallData(callData);
  tx.signSubmitAndWatch(signer, {
    asset: asset,
  }).subscribe(observer);
}
