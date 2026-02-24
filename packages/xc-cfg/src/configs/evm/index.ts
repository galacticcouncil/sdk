import { ChainRoutes } from '@galacticcouncil/xc-core';

import { baseConfig } from './base';
import { ethereumConfig } from './ethereum';

export const evmChainsConfig: ChainRoutes[] = [baseConfig, ethereumConfig];
