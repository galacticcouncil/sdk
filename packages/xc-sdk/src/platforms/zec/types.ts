import { Call } from '../types';

export interface ZecCall extends Call {
  /** Transparent address paid. */
  to: string;
  /** Zatoshi. */
  amount: bigint;
}

/** A Zcash wallet, building, signing and broadcasting on its own. */
export interface ZecWallet {
  /**
   * @param params.amount - in ZEC, decimal
   * @returns transaction id
   */
  sendTransaction(params: { to: string; amount: string }): Promise<string>;
}

export interface ZecTxObserver {
  onTransactionSend: (txId: string) => void;
  onError: (error: unknown) => void;
}
