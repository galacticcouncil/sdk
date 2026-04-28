import { Transaction as PapiTransaction } from 'polkadot-api';

import { HydrationApis } from '@galacticcouncil/descriptors';

export interface Tx {
  name?: string;
  get(): Transaction;
  dryRun(account: string): Promise<DryRunResult>;
}

export type Transaction = PapiTransaction<void | undefined>;
export type DryRunResult = HydrationApis['DryRunApi']['dry_run_call']['Value'];

export type DryRunArgs = HydrationApis['DryRunApi']['dry_run_call']['Args'];
