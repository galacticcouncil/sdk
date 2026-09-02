import { ChainRoutes } from '@galacticcouncil/xc-core';

import { assetHubConfig, assetHubCexConfig } from './assethub';
import { astarConfig } from './astar';
import { bifrostConfig } from './bifrost';
import { hydrationConfig } from './hydration';
import { mythosConfig } from './mythos';
import { uniqueConfig } from './unique';
import { pendulumConfig } from './pendulum';
import { energywebxConfig } from './energywebx';
import { neurowebConfig } from './neuroweb';

export const polkadotChainsConfig: ChainRoutes[] = [
  assetHubConfig,
  assetHubCexConfig,
  astarConfig,
  bifrostConfig,
  hydrationConfig,
  mythosConfig,
  neurowebConfig,
  uniqueConfig,
  pendulumConfig,
  energywebxConfig,
];
