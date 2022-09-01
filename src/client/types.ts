import type { Struct } from '@polkadot/types-codec';
import type { Balance } from '@polkadot/types/interfaces/runtime';

export interface TokensAccountData extends Struct {
  readonly free: Balance;
  readonly reserved: Balance;
  readonly frozen: Balance;
}
