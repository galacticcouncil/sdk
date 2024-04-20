import { Bridge } from './contracts/bridge';
import { Batch } from './contracts/batch';

export function ContractBuilderV2() {
  return {
    Bridge,
    Batch,
  };
}
