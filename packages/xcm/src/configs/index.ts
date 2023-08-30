import { ChainConfig } from '@galacticcouncil/xcm-config';

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
