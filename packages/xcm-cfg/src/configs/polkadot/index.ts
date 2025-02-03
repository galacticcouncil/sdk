import { ChainRoutes } from '@galacticcouncil/xcm-core';

import { acalaConfig } from './acala';
import { assetHubConfig, assetHubCexConfig } from './assethub';
import { astarConfig } from './astar';
import { bifrostConfig } from './bifrost';
import { centrifugeConfig } from './centrifuge';
import { hydrationConfig } from './hydration';
import { interlayConfig } from './interlay';
import { moonbeamConfig } from './moonbeam';
import { mythosConfig } from './mythos';
import { nodleConfig } from './nodle';
import { polkadotConfig, polkadotCexConfig } from './polkadot';
import { subsocialConfig } from './subsocial';
import { uniqueConfig } from './unique';
import { zeitgeistConfig } from './zeitgeist';
import { phalaConfig } from './phala';
import { crustConfig } from './crust';
import { kiltConfig } from './kilt';
import { pendulumConfig } from './pendulum';
import { darwiniaConfig } from './darwinia';
import { ajunaConfig } from './ajuna';

export const polkadotChainsConfig: ChainRoutes[] = [
  acalaConfig,
  ajunaConfig,
  assetHubConfig,
  assetHubCexConfig,
  astarConfig,
  bifrostConfig,
  centrifugeConfig,
  hydrationConfig,
  interlayConfig,
  moonbeamConfig,
  mythosConfig,
  nodleConfig,
  polkadotConfig,
  polkadotCexConfig,
  subsocialConfig,
  uniqueConfig,
  zeitgeistConfig,
  phalaConfig,
  crustConfig,
  kiltConfig,
  pendulumConfig,
  darwiniaConfig,
];
