import { Batch } from './contracts/Batch';
import { Erc20 } from './contracts/Erc20';
import { InstaBridge } from './contracts/InstaBridge';
import { PolkadotXcm } from './contracts/PolkadotXcm';
import { Snowbridge } from './contracts/Snowbridge';
import { Wormhole } from './contracts/Wormhole';

export function ContractBuilder() {
  return {
    Batch,
    Erc20,
    InstaBridge,
    PolkadotXcm,
    Snowbridge,
    Wormhole,
  };
}
