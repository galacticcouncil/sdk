import { ContractConfig, EvmClient } from '@galacticcouncil/xcm2-core';

import { EvmTransfer } from './EvmTransfer';

export class EvmTransferFactory {
  static get(client: EvmClient, config: ContractConfig): EvmTransfer {
    return new EvmTransfer(client, config);
  }
}
