import { type CallDryRunEffects } from '@polkadot/types/interfaces';
import { type SubmittableExtrinsic } from '@polkadot/api/promise/types';

export interface Transaction {
  hex: string;
  name?: string;
  get(): SubmittableExtrinsic;
  dryRun(account: string): Promise<CallDryRunEffects>;
}
