import {
  Transaction as SafeTransaction,
  UnsafeTransaction,
} from 'polkadot-api';

import { HydrationApis } from '@galacticcouncil/descriptors';

export interface Tx {
  name?: string;
  get(): Transaction;
  dryRun(account: string): Promise<DryRunResult>;
}

export type SafeTx = SafeTransaction<any, string, string, void | undefined>;
export type UnsafeTx = UnsafeTransaction<any, string, string, void | undefined>;

export type Transaction = SafeTx | UnsafeTx;
export type DryRunResult = HydrationApis['DryRunApi']['dry_run_call']['Value'];

export type DryRunArgs = HydrationApis['DryRunApi']['dry_run_call']['Args'];
