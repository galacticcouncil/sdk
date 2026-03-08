import { SolanaChain } from '@galacticcouncil/xc-core';

import { Keypair, MessageV0, VersionedTransaction } from '@solana/web3.js';

import { Buffer } from 'buffer';

import { SolanaLilJit } from './SolanaLilJit';
import { SolanaCall } from './types';

import { Call } from '../types';

export interface SolanaWallet {
  connect(): Promise<void>;
  signAndSendTransaction(
    transaction: VersionedTransaction
  ): Promise<{ signature: string }>;
  signAllTransactions(
    transactions: VersionedTransaction[]
  ): Promise<VersionedTransaction[]>;
}

export interface SolanaSignerObserver {
  onTransactionSend: (hash: string) => void;
  onStatus?: (status: any) => void;
  onBundleStatus?: (
    status: Array<{
      bundle_id: string;
      landed_slot: number;
      status: string;
    }>
  ) => void;
  onError: (error: unknown) => void;
}

export class SolanaSigner {
  readonly #chain: SolanaChain;
  readonly #wallet: SolanaWallet | Keypair;
  readonly #lilJit: SolanaLilJit;

  constructor(chain: SolanaChain, wallet: SolanaWallet | Keypair) {
    this.#chain = chain;
    this.#wallet = wallet;
    this.#lilJit = new SolanaLilJit(chain);
  }

  async signAndSend(call: Call, observer: SolanaSignerObserver) {
    const { data, signers } = call as SolanaCall;
    const versioned = this.toVersioned(data, signers);

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

  async signAndSendAll(calls: Call[], observer: SolanaSignerObserver) {
    const versioned = calls.map((c) => {
      const { data, signers } = c as SolanaCall;
      return this.toVersioned(data, signers);
    });

    try {
      let encoded: string[];

      if (this.#wallet instanceof Keypair) {
        versioned.forEach((tx) => tx.sign([this.#wallet as Keypair]));
        encoded = versioned.map((tx) =>
          Buffer.from(tx.serialize()).toString('base64')
        );
      } else {
        const wallet = this.#wallet;
        await wallet.connect();
        const signed = await wallet.signAllTransactions(versioned);
        encoded = signed.map((s) =>
          Buffer.from(s.serialize()).toString('base64')
        );
      }

      const simulation = await this.#lilJit.simulateBundle(encoded);
      if (simulation.value.summary !== 'succeeded') {
        throw new Error(
          'Bundle simulation failed: ' + JSON.stringify(simulation)
        );
      }

      const bundleId = await this.#lilJit.sendBundle(encoded);
      observer.onTransactionSend(bundleId);

      const status = await this.#lilJit.getInflightBundleStatuses([bundleId]);
      observer.onBundleStatus?.(status.value);
    } catch (err) {
      observer.onError(err);
    }
  }

  private toVersioned(data: string, signers?: Keypair[]): VersionedTransaction {
    const mssgBuffer = Buffer.from(data, 'hex');
    const mssgArray = Uint8Array.from(mssgBuffer);
    const mssgV0 = MessageV0.deserialize(mssgArray);
    const versioned = new VersionedTransaction(mssgV0);
    if (signers) {
      versioned.sign(signers);
    }
    return versioned;
  }
}
