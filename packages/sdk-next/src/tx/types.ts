import { Transaction as PapiTransaction } from 'polkadot-api';

import { HydrationApis } from '@galacticcouncil/descriptors';

export interface Tx {
  name?: string;
  get(): Transaction;
  dryRun(account: string): Promise<DryRunResult>;
}

export type Transaction = PapiTransaction<void | undefined>;

/**
 * Call made by ICE once an intent resolves.
 *
 * - Runs as the intent owner, after the solution settles
 * - ICE caps `data` at 512 bytes
 */
export interface IntentForward {
  /** EVM contract to call */
  contract: string;
  /** Calldata handed to the contract */
  data: Uint8Array;
}
export type DryRunResult = HydrationApis['DryRunApi']['dry_run_call']['Value'];

export type DryRunArgs = HydrationApis['DryRunApi']['dry_run_call']['Args'];
