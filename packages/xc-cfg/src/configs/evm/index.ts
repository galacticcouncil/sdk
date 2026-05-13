import { ChainRoutes } from '@galacticcouncil/xc-core';

import { arbitrumConfig } from './arbitrum';
import { baseConfig } from './base';
import { ethereumConfig } from './ethereum';
import { optimismConfig } from './optimism';

export const evmChainsConfig: ChainRoutes[] = [
  arbitrumConfig,
  baseConfig,
  ethereumConfig,
  optimismConfig,
];
