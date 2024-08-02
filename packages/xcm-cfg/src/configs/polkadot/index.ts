import { ChainConfig } from '@galacticcouncil/xcm-core';

import { acalaConfig } from './acala';
import { acalaEvmConfig } from './acala-evm';
import { assetHubConfig } from './assethub';
import { astarConfig } from './astar';
import { bifrostConfig } from './bifrost';
import { centrifugeConfig } from './centrifuge';
import { hydraDxConfig } from './hydraDX';
import { interlayConfig } from './interlay';
import { moonbeamConfig } from './moonbeam';
import { mythosConfig } from './mythos';
import { nodleConfig } from './nodle';
import { polkadotConfig } from './polkadot';
import { subsocialConfig } from './subsocial';
import { uniqueConfig } from './unique';
import { zeitgeistConfig } from './zeitgeist';
import { phalaConfig } from './phala';
import { crustConfig } from './crust';
import { kiltConfig } from './kilt';
import { pendulumConfig } from './pendulum';
import { darwiniaConfig } from './darwinia';
import { ajunaConfig } from './ajuna';

export const polkadotChainsConfig: ChainConfig[] = [
  acalaConfig,
  acalaEvmConfig,
  ajunaConfig,
  assetHubConfig,
  astarConfig,
  bifrostConfig,
  centrifugeConfig,
  hydraDxConfig,
  interlayConfig,
  moonbeamConfig,
  mythosConfig,
  nodleConfig,
  polkadotConfig,
  subsocialConfig,
  uniqueConfig,
  zeitgeistConfig,
  phalaConfig,
  crustConfig,
  kiltConfig,
  pendulumConfig,
  darwiniaConfig,
];
