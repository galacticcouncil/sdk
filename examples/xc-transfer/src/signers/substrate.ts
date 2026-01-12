import { Binary, TxEvent } from 'polkadot-api';

import type { AnyChain, AnyParachain } from '@galacticcouncil/xc-core';
import type { Call, SubstrateCall } from '@galacticcouncil/xc-sdk';

import { getSignerBySource, getFeeAsset } from './v2';

export async function signAndSend(
  call: Call,
  chain: AnyChain,
  observer: (value: TxEvent) => void
) {
  const ctx = chain as AnyParachain;

  const { from, data, txOptions } = call as SubstrateCall;

  const signer = await getSignerBySource('polkadot-js', from);

  const client = ctx.client;
  const api = client.getUnsafeApi();

  const callData = Binary.fromHex(call.data);

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
