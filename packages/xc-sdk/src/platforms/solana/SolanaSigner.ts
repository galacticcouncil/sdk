import { SolanaChain } from '@galacticcouncil/xc-core';

import { Keypair, MessageV0, VersionedTransaction } from '@solana/web3.js';

import { Buffer } from 'buffer';

import { SolanaCall, SolanaWallet, SolanaTxObserver } from './types';

import { Call } from '../types';

export class SolanaSigner {
  readonly #chain: SolanaChain;
  readonly #wallet: SolanaWallet | Keypair;

  constructor(chain: SolanaChain, wallet: SolanaWallet | Keypair) {
    this.#chain = chain;
    this.#wallet = wallet;
  }

  async signAndSend(call: Call, observer: SolanaTxObserver) {
    const { data, signers } = call as SolanaCall;
    const versioned = await this.toVersioned(data, signers);

    try {
      if (this.#wallet instanceof Keypair) {
        versioned.sign([this.#wallet]);
        const signature =
          await this.#chain.connection.sendTransaction(versioned);
        observer.onTransactionSend(signature);
        const status =
          await this.#chain.connection.getSignatureStatus(signature);
        observer.onStatus?.(status);
        return;
      }

      const wallet = this.#wallet;
      await wallet.connect();
      if (signers) {
        versioned.sign(signers);
      }
      const { signature } = await wallet.signAndSendTransaction(versioned);
      observer.onTransactionSend(signature);
      const status = await this.#chain.connection.getSignatureStatus(signature);
      observer.onStatus?.(status);
    } catch (err) {
      observer.onError(err);
    }
  }

  async signAndSendAll(calls: Call[], observer: SolanaTxObserver) {
    try {
      const { blockhash, lastValidBlockHeight } =
        await this.#chain.connection.getLatestBlockhash();

      const versioned = await Promise.all(
        calls.map((c) => {
          const { data, signers } = c as SolanaCall;
          return this.toVersioned(data, signers, blockhash);
        })
      );

      let signed: VersionedTransaction[];

      if (this.#wallet instanceof Keypair) {
        versioned.forEach((tx) => tx.sign([this.#wallet as Keypair]));
        signed = versioned;
      } else {
        const wallet = this.#wallet;
        await wallet.connect();
        signed = await wallet.signAllTransactions(versioned);
      }

      for (const tx of signed) {
        const signature = await this.#chain.connection.sendTransaction(tx);
        observer.onTransactionSend(signature);
        const status = await this.#chain.connection
          .confirmTransaction(
            { signature, blockhash, lastValidBlockHeight },
            'confirmed'
          )
          .catch((err) => {
            throw err instanceof Error
              ? err
              : new Error(signature + ' failed: ' + JSON.stringify(err));
          });
        observer.onStatus?.(status);
        if (status.value.err) {
          throw new Error(
            signature + ' failed: ' + JSON.stringify(status.value.err)
          );
        }
      }
    } catch (err) {
      observer.onError(err);
    }
  }

  private async toVersioned(
    data: string,
    signers?: Keypair[],
    recentBlockhash?: string
  ): Promise<VersionedTransaction> {
    const mssgBuffer = Buffer.from(data, 'hex');
    const mssgArray = Uint8Array.from(mssgBuffer);
    const mssgV0 = MessageV0.deserialize(mssgArray);

    mssgV0.recentBlockhash =
      recentBlockhash ??
      (await this.#chain.connection.getLatestBlockhash()).blockhash;

    const versioned = new VersionedTransaction(mssgV0);
    if (signers) {
      versioned.sign(signers);
    }
    return versioned;
  }
}
