import { evm } from './balance/evm';
import { substrate } from './balance/substrate';
import { solana } from './balance/solana';

export function BalanceBuilder() {
  return {
    evm,
    substrate,
    solana,
  };
}
