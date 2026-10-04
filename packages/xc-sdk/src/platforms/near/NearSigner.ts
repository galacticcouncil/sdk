import { NearChain, NearTxOutcome } from '@galacticcouncil/xc-core';

import { base58 } from '@scure/base';

import {
  NearCall,
  NearFunctionCall,
  NearTxObserver,
  NearWallet,
} from './types';
import { getFailures, NearKeyPair, signTransaction } from './utils';

import { Call } from '../types';

export class NearSigner {
  readonly #chain: NearChain;
  readonly #wallet: NearWallet | NearKeyPair;

  constructor(chain: NearChain, wallet: NearWallet | NearKeyPair) {
    this.#chain = chain;
    this.#wallet = wallet;
  }

  /**
   * Sign & submit a call, then follow it to its final outcome.
   *
   * - A key pair signs here and submits over the chain's rpc
   * - A wallet signs and submits on its own
   * - A failed receipt is reported as an error - the transaction succeeds
   *   around it, e.g. when a token refunds a transfer its receiver refused
   */
  async signAndSend(call: Call, observer: NearTxObserver) {
    const { from, receiverId, actions } = call as NearCall;

    try {
      const outcome =
        this.#wallet instanceof NearKeyPair
          ? await this.sendWithKey(
              this.#wallet,
              from,
              receiverId,
              actions,
              observer
            )
          : await this.sendWithWallet(
              this.#wallet,
              from,
              receiverId,
              actions,
              observer
            );

      if (!outcome) {
        return;
      }

      observer.onStatus?.(outcome);
      const failures = getFailures(outcome);
      if (failures.length > 0) {
        throw new Error(
          outcome.transaction.hash + ' failed: ' + JSON.stringify(failures)
        );
      }
    } catch (err) {
      observer.onError(err);
    }
  }

  private async sendWithKey(
    keyPair: NearKeyPair,
    from: string,
    receiverId: string,
    actions: NearFunctionCall[],
    observer: NearTxObserver
  ): Promise<NearTxOutcome> {
    const { client } = this.#chain;
    const [accessKey, blockHash] = await Promise.all([
      client.viewAccessKey(from, keyPair.getPublicKey()),
      client.getBlockHash(),
    ]);

    const { hash, signedTx } = signTransaction(
      {
        signerId: from,
        publicKey: keyPair.publicKey,
        nonce: BigInt(accessKey.nonce) + 1n,
        receiverId: receiverId,
        blockHash: base58.decode(blockHash),
        actions: actions,
      },
      keyPair
    );

    await client.sendTransaction(signedTx);
    observer.onTransactionSend(hash);
    return client.getTransaction(hash, from);
  }

  private async sendWithWallet(
    wallet: NearWallet,
    from: string,
    receiverId: string,
    actions: NearFunctionCall[],
    observer: NearTxObserver
  ): Promise<NearTxOutcome | void> {
    const outcome = await wallet.signAndSendTransaction({
      signerId: from,
      receiverId: receiverId,
      actions: actions.map(({ methodName, args, gas, deposit }) => ({
        type: 'FunctionCall',
        params: {
          methodName,
          args,
          gas: gas.toString(),
          deposit: deposit.toString(),
        },
      })),
    });

    // A redirecting wallet resolves with nothing - the page is left before
    // the transaction is even signed.
    if (outcome) {
      observer.onTransactionSend(outcome.transaction.hash);
    }
    return outcome;
  }
}
