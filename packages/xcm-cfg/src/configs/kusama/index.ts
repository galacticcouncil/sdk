import { ChainRoutes } from '@galacticcouncil/xcm-core';

import { assetHubConfig } from './assethub';
import { basiliskConfig } from './basilisk';
import { integriteeConfig } from './integritee';
import { karuraConfig } from './karura';
import { kusamaConfig } from './kusama';
import { tinkernetConfig } from './tinkernet';
import { robonomicsConfig } from './robonomics';

export const kusamaChainsConfig: ChainRoutes[] = [
  assetHubConfig,
  basiliskConfig,
  integriteeConfig,
  karuraConfig,
  kusamaConfig,
  tinkernetConfig,
  robonomicsConfig,
];
