import { evm } from './balance/evm';
import { substrate } from './balance/substrate';
import { solana } from './balance/solana';
import { sui } from './balance/sui';

export function BalanceBuilder() {
  return {
    evm,
    substrate,
    solana,
    sui,
  };
}
