import type { Bytes, Compact, Struct, bool, u32, u64, u8 } from "@polkadot/types-codec";
import type { Balance } from "@polkadot/types/interfaces/runtime";

/** @name TokensAccountData */
export interface TokensAccountData extends Struct {
  readonly free: Balance;
  readonly reserved: Balance;
  readonly frozen: Balance;
}
