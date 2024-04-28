import { ContractConfig, EvmClient } from '@galacticcouncil/xcm-core';
import { Batch } from './Batch';
import { TokenBridge } from './TokenBridge';
import { TokenRelayer } from './TokenRelayer';
import { Xtokens } from './Xtokens';

import { EvmTransfer } from './EvmTransfer';

export class EvmTransferFactory {
  static get(client: EvmClient, config: ContractConfig): EvmTransfer {
    switch (config.module) {
      case 'Batch':
        return new Batch(client, config);
      case 'TokenBridge':
        return new TokenBridge(client, config);
      case 'TokenRelayer':
        return new TokenRelayer(client, config);
      case 'Xtokens':
        return new Xtokens(client, config);
      default: {
        throw new Error(
          'Contract type ' + config.module + ' is not supported yet'
        );
      }
    }
  }
}
