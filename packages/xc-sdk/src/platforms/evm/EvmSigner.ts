import { AnyEvmChain, EvmClient, EvmParachain } from '@galacticcouncil/xc-core';

import { Binary } from 'polkadot-api';
import { WalletClient } from 'viem';

import { EvmCall } from './types';

import { Call } from '../types';

export const DISPATCH_ADDRESS = '0x0000000000000000000000000000000000000401';

export interface EvmSignerObserver {
  onTransactionSend: (hash: string) => void;
  onTransactionReceipt: (receipt: any) => void;
  onError: (error: unknown) => void;
}

export class EvmSigner {
  readonly #chain: AnyEvmChain;
  readonly #client: EvmClient;
  readonly #signer: WalletClient;

  constructor(chain: AnyEvmChain, signer: WalletClient) {
    this.#chain = chain;
    this.#client = chain.evmClient;
    this.#signer = signer;
  }

  async signAndSend(call: Call, observer: EvmSignerObserver) {
    const provider = this.#client.getProvider();

    let isDispatch = false;
    if (this.#chain instanceof EvmParachain) {
      try {
        const dotClient = this.#chain.client;
        const callData = Binary.fromHex(call.data);
        const api = dotClient.getUnsafeApi();
        await api.txFromCallData(callData);
        isDispatch = true;
      } catch (_) {}
    }

    let txHash: `0x${string}`;

    if (isDispatch) {
      const [gas, gasPrice] = await Promise.all([
        provider.estimateGas({
          account: call.from as `0x${string}`,
          data: call.data as `0x${string}`,
          to: DISPATCH_ADDRESS as `0x${string}`,
        }),
        provider.getGasPrice(),
      ]);

      const gasPriceExtra = gasPrice + (gasPrice / 100n) * 10n;

      txHash = await this.#signer.sendTransaction({
        account: call.from as `0x${string}`,
        chain: this.#client.chain,
        data: call.data as `0x${string}`,
        maxPriorityFeePerGas: gasPriceExtra,
        maxFeePerGas: gasPriceExtra,
        gas: (gas * 11n) / 10n,
        to: DISPATCH_ADDRESS as `0x${string}`,
      });
    } else {
      const { data, to, value } = call as EvmCall;
      txHash = await this.#signer.sendTransaction({
        account: call.from as `0x${string}`,
        chain: this.#client.chain,
        data: data as `0x${string}`,
        to: to as `0x${string}`,
        value: value,
      });
    }

    observer.onTransactionSend(txHash);
    provider
      .waitForTransactionReceipt({ hash: txHash })
      .then((receipt) => observer.onTransactionReceipt(receipt))
      .catch((error) => observer.onError(error));
  }
}
