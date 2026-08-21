import { Call } from '../types';

export interface SuiCall extends Call {
  commands: any[];
}

export interface SuiWallet {
  requestAccount(): Promise<{ address: string }>;
  signTransaction(params: {
    transaction: string;
    address: string;
    networkID: string;
  }): Promise<{ transaction: string; signature: string }>;
}

export interface SuiTxObserver {
  onTransactionSend: (hash: string) => void;
  onError: (error: unknown) => void;
}
