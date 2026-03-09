import { SuiChain } from '@galacticcouncil/xc-core';

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';

import { SuiCall, SuiWallet, SuiTxObserver } from './types';

import { Call } from '../types';

export class SuiSigner {
  readonly #chain: SuiChain;
  readonly #wallet: SuiWallet | Ed25519Keypair;

  constructor(chain: SuiChain, wallet: SuiWallet | Ed25519Keypair) {
    this.#chain = chain;
    this.#wallet = wallet;
  }

  async signAndSend(call: Call, observer: SuiTxObserver) {
    const { from, data } = call as SuiCall;
    const client = this.#chain.client;

    try {
      if (this.#wallet instanceof Ed25519Keypair) {
        const transaction = Transaction.from(data);
        const result = await client.signAndExecuteTransaction({
          signer: this.#wallet,
          transaction,
          options: {
            showEffects: true,
            showEvents: true,
            showObjectChanges: true,
            showBalanceChanges: true,
          },
        });
        observer.onTransactionSend(result.digest);
        return;
      }

      const transaction = Transaction.from(data);
      const params = {
        transaction: await transaction.toJSON(),
        address: from,
        networkID: 'SuiMainnet',
      };

      const signed = await this.#wallet.signTransaction(params);
      const { transaction: txBytesB64, signature } = signed;

      const exec = await client.executeTransactionBlock({
        transactionBlock: txBytesB64,
        signature,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });
      observer.onTransactionSend(exec.digest);
    } catch (err) {
      observer.onError(err);
    }
  }
}
