import { ContractConfig, EvmClient } from '@galacticcouncil/xcm2-core';

import { Erc20 } from './Erc20';
import { Native } from './Native';
import { EvmBalance } from './EvmBalance';

export class EvmBalanceFactory {
  static get(client: EvmClient, config: ContractConfig): EvmBalance {
    switch (config.module) {
      case 'Erc20':
        return new Erc20(client, config);
      case 'Native':
        return new Native(client, config);
      default: {
        throw new Error('Module ' + config.module + ' is not supported');
      }
    }
  }
}
