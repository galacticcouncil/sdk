import { ChainConfig } from '@galacticcouncil/xcm-core';

import { kusamaChainsConfig } from './kusama';
import { evmChainsConfig } from './evm';

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
import { kiltConfig } from './kilt';
import { pendulumConfig } from './pendulum';

export const polkadotChainsConfig: ChainConfig[] = [
  acalaConfig,
  assetHubConfig,
  astarConfig,
  bifrostConfig,
  centrifugeConfig,
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
  kiltConfig,
  pendulumConfig,
];

export const chainsConfig: ChainConfig[] = [
  ...polkadotChainsConfig,
  ...evmChainsConfig,
  ...kusamaChainsConfig,
];

export const chainsConfigMap = new Map<string, ChainConfig>(
  chainsConfig.map((config) => [config.chain.key, config])
);
