import { NearTxOutcome } from '@galacticcouncil/xc-core';

import { Call } from '../types';

/** A function call action of a NEAR transaction. */
export interface NearFunctionCall {
  methodName: string;
  args: Record<string, unknown>;
  /** Prepaid gas - whatever is left unused is refunded. */
  gas: bigint;
  /** Attached deposit, yocto. */
  deposit: bigint;
}

export interface NearCall extends Call {
  /** Contract the transaction is sent to. */
  receiverId: string;
  /** Function calls, run in order and atomically. */
  actions: NearFunctionCall[];
}

/** A function call as NEAR wallets take it (wallet selector, near connect). */
export interface NearWalletAction {
  type: 'FunctionCall';
  params: {
    methodName: string;
    args: Record<string, unknown>;
    gas: string;
    deposit: string;
  };
}

/** A NEAR wallet, signing and submitting on its own. */
export interface NearWallet {
  signAndSendTransaction(params: {
    signerId?: string;
    receiverId: string;
    actions: NearWalletAction[];
  }): Promise<NearTxOutcome | void>;
}

export interface NearTxObserver {
  onTransactionSend: (hash: string) => void;
  /** Final execution outcome, the whole receipt tree included. */
  onStatus?: (outcome: NearTxOutcome) => void;
  onError: (error: unknown) => void;
}
