import { Batch } from './contracts/Batch';
import { Erc20 } from './contracts/Erc20';
import { TokenBridge } from './contracts/TokenBridge';
import { Xtokens } from './contracts/Xtokens';

export function ContractBuilderV2() {
  return {
    Batch,
    Erc20,
    TokenBridge,
    Xtokens,
  };
}
