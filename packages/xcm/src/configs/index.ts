import { ChainConfig } from '@moonbeam-network/xcm-config';

import { acalaConfig } from './acala';
import { assetHubConfig } from './assethub';
import { astarConfig } from './astar';
import { bifrostConfig } from './bifrost';
import { centrifugeConfig } from './centrifuge';
import { hydraDxConfig } from './hydraDX';
import { interlayConfig } from './interlay';
import { moonbeamConfig } from './moonbeam';
import { polkadotConfig } from './polkadot';
import { zeitgeistConfig } from './zeitgeist';

export const chainsConfig: ChainConfig[] = [
  acalaConfig,
  assetHubConfig,
  astarConfig,
  bifrostConfig,
  centrifugeConfig,
  hydraDxConfig,
  interlayConfig,
  moonbeamConfig,
  polkadotConfig,
  zeitgeistConfig,
];

export const chainsConfigMap = new Map<string, ChainConfig>(chainsConfig.map((config) => [config.chain.key, config]));
