import { SolanaQueryConfig } from '@galacticcouncil/xcm-core';

import { Connection } from '@solana/web3.js';

import { Native } from './Native';
import { SolanaBalance } from './SolanaBalance';

export class SolanaBalanceFactory {
  static get(connection: Connection, config: SolanaQueryConfig): SolanaBalance {
    switch (config.module) {
      case 'Native':
        return new Native(connection, config);
      default: {
        throw new Error('Module ' + config.module + ' is not supported');
      }
    }
  }
}
