import { ChainConfig } from '@galacticcouncil/xcm-core';

import { assetHubConfig } from './assethub';
import { basiliskConfig } from './basilisk';
import { encointerConfig } from './encointer';
import { integriteeConfig } from './integritee';
import { karuraConfig } from './karura';
import { kusamaConfig } from './kusama';
import { tinkernetConfig } from './tinkernet';
import { robonomicsConfig } from './robonomics';

export const kusamaChainsConfig: ChainConfig[] = [
  assetHubConfig,
  basiliskConfig,
  encointerConfig,
  integriteeConfig,
  karuraConfig,
  kusamaConfig,
  tinkernetConfig,
  robonomicsConfig,
];
