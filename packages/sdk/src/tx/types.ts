import { type CallDryRunEffects } from '@polkadot/types/interfaces';
import { type SubmittableExtrinsic } from '@polkadot/api/promise/types';

export interface Transaction<T, R> {
  hex: string;
  name?: string;
  get(): T;
  dryRun(account: string): Promise<R>;
}

export type SubstrateTransaction = Transaction<
  SubmittableExtrinsic,
  CallDryRunEffects
>;
