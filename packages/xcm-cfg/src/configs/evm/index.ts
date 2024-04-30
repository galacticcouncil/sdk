import { ChainConfig } from '@galacticcouncil/xcm-core';

import { ethereumConfig } from './ethereum';
import { fantomConfig } from './fantom';

export const evmChainsConfig: ChainConfig[] = [ethereumConfig, fantomConfig];
