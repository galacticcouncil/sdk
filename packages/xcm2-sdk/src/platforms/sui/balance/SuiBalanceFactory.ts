import { SuiQueryConfig } from '@galacticcouncil/xcm2-core';

import { SuiClient } from '@mysten/sui/client';

import { Native } from './Native';
import { SuiBalance } from './SuiBalance';

export class SuiBalanceFactory {
  static get(client: SuiClient, config: SuiQueryConfig): SuiBalance {
    switch (config.module) {
      case 'Native':
        return new Native(client, config);
      default: {
        throw new Error('Module ' + config.module + ' is not supported');
      }
    }
  }
}
