import { Batch } from './contracts/Batch';
import { Erc20 } from './contracts/Erc20';
import { PolkadotXcm } from './contracts/PolkadotXcm';
import { Snowbridge } from './contracts/Snowbridge';
import { Wormhole } from './contracts/Wormhole';

export function ContractBuilder() {
  return {
    Batch,
    Erc20,
    PolkadotXcm,
    Snowbridge,
    Wormhole,
  };
}
