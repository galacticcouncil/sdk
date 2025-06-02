import {
  Transaction as STransaction,
  UnsafeTransaction as UTransaction,
} from 'polkadot-api';

export interface Transaction<T, R> {
  name?: string;
  get(): T;
  dryRun(account: string): Promise<R>;
}

type SafeTx = STransaction<any, string, string, void | undefined>;
type UnsafeTx = UTransaction<any, string, string, void | undefined>;

export type Tx = SafeTx;
export type SubstrateTransaction = Transaction<Tx, any>;
