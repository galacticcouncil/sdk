import { ContractConfig, EvmClient } from '@galacticcouncil/xc-core';

import { EvmTransfer } from './EvmTransfer';

export class EvmTransferFactory {
  static get(client: EvmClient, config: ContractConfig): EvmTransfer {
    return new EvmTransfer(client, config);
  }
}
