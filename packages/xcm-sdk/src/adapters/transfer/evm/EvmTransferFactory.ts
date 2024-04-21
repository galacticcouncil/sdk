import { ContractConfig } from '@moonbeam-network/xcm-builder';
import { Batch } from './Batch';
import { TokenBridge } from './TokenBridge';
import { Xtokens } from './Xtokens';
import { EvmTransfer } from './EvmTransfer';

import { EvmClient } from '../../../evm';

export class EvmTransferFactory {
  static get(client: EvmClient, config: ContractConfig): EvmTransfer {
    switch (config.module) {
      case 'Batch':
        return new Batch(client, config);
      case 'TokenBridge':
        return new TokenBridge(client, config);
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
