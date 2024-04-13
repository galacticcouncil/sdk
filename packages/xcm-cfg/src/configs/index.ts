import { ChainConfig } from '@moonbeam-network/xcm-config';

import { kusamaChainsConfig } from './kusama';

import { acalaConfig } from './acala';
import { assetHubConfig } from './assethub';
import { astarConfig } from './astar';
import { bifrostConfig } from './bifrost';
import { centrifugeConfig } from './centrifuge';
import { hydraDxConfig } from './hydraDX';
import { interlayConfig } from './interlay';
import { moonbeamConfig } from './moonbeam';
import { nodleConfig } from './nodle';
import { polkadotConfig } from './polkadot';
import { subsocialConfig } from './subsocial';
import { uniqueConfig } from './unique';
import { zeitgeistConfig } from './zeitgeist';
import { phalaConfig } from './phala';
import { crustConfig } from './crust';

// mrl
import { acalaMrlConfig } from './acalaMrl';
import { ethereumMrlConfig } from './ethereumMrl';

export const polkadotChainsConfig: ChainConfig[] = [
  acalaConfig,
  acalaMrlConfig,
  assetHubConfig,
  astarConfig,
  bifrostConfig,
  centrifugeConfig,
  ethereumMrlConfig,
  hydraDxConfig,
  interlayConfig,
  moonbeamConfig,
  nodleConfig,
  polkadotConfig,
  subsocialConfig,
  uniqueConfig,
  zeitgeistConfig,
  phalaConfig,
  crustConfig,
];

export const chainsConfig: ChainConfig[] = [
  ...polkadotChainsConfig,
  ...kusamaChainsConfig,
];

export const chainsConfigMap = new Map<string, ChainConfig>(
  chainsConfig.map((config) => [config.chain.key, config])
);
