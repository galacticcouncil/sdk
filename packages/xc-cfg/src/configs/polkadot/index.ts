import { ChainRoutes } from '@galacticcouncil/xc-core';

import { assetHubConfig, assetHubCexConfig } from './assethub';
import { astarConfig } from './astar';
import { bifrostConfig } from './bifrost';
import { hydrationConfig } from './hydration';
import { interlayConfig } from './interlay';
import { moonbeamConfig } from './moonbeam';
import { mythosConfig } from './mythos';
import { uniqueConfig } from './unique';
import { crustConfig } from './crust';
import { pendulumConfig } from './pendulum';
import { ajunaConfig } from './ajuna';
import { laosConfig } from './laos';
import { energywebxConfig } from './energywebx';
import { neurowebConfig } from './neuroweb';

export const polkadotChainsConfig: ChainRoutes[] = [
  ajunaConfig,
  assetHubConfig,
  assetHubCexConfig,
  astarConfig,
  bifrostConfig,
  hydrationConfig,
  interlayConfig,
  moonbeamConfig,
  mythosConfig,
  neurowebConfig,
  uniqueConfig,
  crustConfig,
  pendulumConfig,
  laosConfig,
  energywebxConfig,
];
