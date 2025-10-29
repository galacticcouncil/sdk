import { Binary, TxEvent } from 'polkadot-api';

import type { AnyChain, AnyParachain } from '@galacticcouncil/xcm-core';
import type { Call, SubstrateCall } from '@galacticcouncil/xcm-sdk';

import { getSignerBySource, getWs, getFeeAsset } from './v2';

export async function signAndSend(
  call: Call,
  chain: AnyChain,
  observer: (value: TxEvent) => void
) {
  const ctx = chain as AnyParachain;

  const { from, data, txOptions } = call as SubstrateCall;

  const signer = await getSignerBySource('polkadot-js', from);

  const apiPjs = await ctx.api;
  const extrinsic = apiPjs.tx(data);

  const client = await getWs(ctx.ws);
  const api = client.getUnsafeApi();

  const callData = Binary.fromHex(extrinsic.inner.toHex());

  let opts = {};
  if (txOptions && txOptions.asset) {
    const feeAsset = getFeeAsset(ctx, txOptions.asset);
    opts = {
      ...opts,
      asset: feeAsset,
    };
  }

  const tx = await api.txFromCallData(callData);
  tx.signSubmitAndWatch(signer, opts).subscribe(observer);
}
