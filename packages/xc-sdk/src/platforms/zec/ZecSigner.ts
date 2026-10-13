import { ZecChain } from '@galacticcouncil/xc-core';

import { ZecCall, ZecTxObserver, ZecWallet } from './types';
import { formatZec } from './utils';

import { Call } from '../types';

export class ZecSigner {
  readonly #wallet: ZecWallet;

  constructor(_chain: ZecChain, wallet: ZecWallet) {
    this.#wallet = wallet;
  }

  /**
   * Sign & broadcast a payment in the wallet.
   *
   * - The wallet builds the transaction, picks the funds and settles the fee
   * - Reported sent once the wallet hands back the id; the deposit is not
   *   followed any further here
   */
  async signAndSend(call: Call, observer: ZecTxObserver): Promise<void> {
    const { to, amount } = call as ZecCall;

    try {
      const txId = await this.#wallet.sendTransaction({
        to,
        amount: formatZec(amount),
      });
      observer.onTransactionSend(txId);
    } catch (err) {
      observer.onError(err);
    }
  }
}
