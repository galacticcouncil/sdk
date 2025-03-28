import type { Struct, u128, u32 } from '@polkadot/types-codec';

export interface AaveTradeExecutorPoolData extends Struct {
  readonly reserve: u32;
  readonly atoken: u32;
  readonly liqudityIn: u128;
  readonly liqudityOut: u128;
}
