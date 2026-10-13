import { ZecChain } from '@galacticcouncil/xc-core';

import { ZecCall, ZecTxObserver, ZecWallet } from './types';
import { formatZec } from './utils';

import { Call } from '../types';

export class ZecSigner {
  readonly #wallet: ZecWallet;

  constructor(_chain: ZecChain, wallet: ZecWallet) {
    this.#wallet = wallet;
  }

  /** The wallet builds, signs and broadcasts the payment. */
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
