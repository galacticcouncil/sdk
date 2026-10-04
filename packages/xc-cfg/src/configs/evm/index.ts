import { ChainRoutes } from '@galacticcouncil/xc-core';

import { baseConfig } from './base';
import { ethereumConfig } from './ethereum';
import { hyperevmConfig } from './hyperevm';
import { robinhoodConfig } from './robinhood';

export const evmChainsConfig: ChainRoutes[] = [
  baseConfig,
  ethereumConfig,
  hyperevmConfig,
  robinhoodConfig,
];
