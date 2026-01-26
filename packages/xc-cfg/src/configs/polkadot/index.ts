import { ChainRoutes } from '@galacticcouncil/xc-core';

import { acalaConfig } from './acala';
import { assetHubConfig, assetHubCexConfig } from './assethub';
import { astarConfig } from './astar';
import { bifrostConfig } from './bifrost';
import { hydrationConfig } from './hydration';
import { interlayConfig } from './interlay';
import { moonbeamConfig } from './moonbeam';
import { mythosConfig } from './mythos';
import { uniqueConfig } from './unique';
import { zeitgeistConfig } from './zeitgeist';
import { crustConfig } from './crust';
import { kiltConfig } from './kilt';
import { pendulumConfig } from './pendulum';
import { darwiniaConfig } from './darwinia';
import { ajunaConfig } from './ajuna';
import { laosConfig } from './laos';
import { energywebxConfig } from './energywebx';
import { neurowebConfig } from './neuroweb';

export const polkadotChainsConfig: ChainRoutes[] = [
  acalaConfig,
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
  zeitgeistConfig,
  crustConfig,
  kiltConfig,
  pendulumConfig,
  darwiniaConfig,
  laosConfig,
  energywebxConfig,
];
