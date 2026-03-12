import { multiloc, AnyParachain, Asset } from '@galacticcouncil/xc-core';

import { Binary, Enum, PolkadotSigner, TxEvent } from 'polkadot-api';

import { SubstrateCall, SubstrateTxObserver } from './types';

export class SubstrateSigner {
  readonly #chain: AnyParachain;
  readonly #signer: PolkadotSigner;

  constructor(chain: AnyParachain, signer: PolkadotSigner) {
    this.#chain = chain;
    this.#signer = signer;
  }

  signAndSend(call: SubstrateCall, observer: SubstrateTxObserver) {
    const client = this.#chain.client;
    const api = client.getUnsafeApi();

    const callData = Binary.fromHex(call.data);

    let opts: Record<string, unknown> = {};
    if (call.txOptions?.asset) {
      const feeAsset = this.getFeeAsset(call.txOptions.asset);
      opts = { asset: feeAsset };
    }

    api.txFromCallData(callData).then((tx) => {
      tx.signSubmitAndWatch(this.#signer, opts).subscribe({
        next: (event: TxEvent) => {
          if (event.type === 'broadcasted') {
            observer.onTransactionSend(event.txHash);
          }
          if (event.type === 'finalized') {
            observer.onFinalized(event);
          }
        },
        error: (err: unknown) => {
          observer.onError(err);
        },
      });
    });
  }

  private getFeeAsset(asset: Asset) {
    const location = this.#chain.getAssetXcmLocation(asset);
    if (location) {
      const pallet = multiloc.findPalletInstance(location);
      const index = multiloc.findGeneralIndex(location);
      return {
        parents: 0,
        interior: Enum('X2', [
          Enum('PalletInstance', Number(pallet)),
          Enum('GeneralIndex', BigInt(index)),
        ]),
      };
    }
    throw new Error('Asset location not found');
  }
}
