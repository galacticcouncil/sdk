import { ChainRoutes } from '@galacticcouncil/xc-core';

import { baseConfig } from './base';
import { ethereumConfig } from './ethereum';
import { robinhoodConfig } from './robinhood';

export const evmChainsConfig: ChainRoutes[] = [
  baseConfig,
  ethereumConfig,
  robinhoodConfig,
];
