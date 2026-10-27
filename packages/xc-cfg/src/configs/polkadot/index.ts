import { ChainRoutes } from '@galacticcouncil/xc-core';

import { assetHubConfig, assetHubCexConfig } from './assethub';
import { astarConfig } from './astar';
import { bifrostConfig } from './bifrost';
import { hydrationConfig } from './hydration';
import { mythosConfig } from './mythos';
import { pendulumConfig } from './pendulum';
import { energywebxConfig } from './energywebx';

export const polkadotChainsConfig: ChainRoutes[] = [
  assetHubConfig,
  assetHubCexConfig,
  astarConfig,
  bifrostConfig,
  hydrationConfig,
  mythosConfig,
  pendulumConfig,
  energywebxConfig,
];
