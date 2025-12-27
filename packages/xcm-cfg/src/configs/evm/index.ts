import { ChainRoutes } from '@galacticcouncil/xcm-core';

import { ethereumConfig } from './ethereum';
import { baseConfig } from './base';

export const evmChainsConfig: ChainRoutes[] = [ethereumConfig, baseConfig];
