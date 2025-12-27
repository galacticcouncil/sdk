import { AnyChain } from '@galacticcouncil/xc-core';

import { kusamaAssetHub } from './assethub';
import { basilisk } from './basilisk';
import { integritee } from './integritee';
import { karura } from './karura';
import { kusama } from './kusama';
import { robonomics } from './robonomics';
import { tinkernet } from './tinkernet';

export const kusamaChains: AnyChain[] = [
  kusama,
  kusamaAssetHub,
  basilisk,
  integritee,
  karura,
  robonomics,
  tinkernet,
];

export {
  kusama,
  kusamaAssetHub,
  basilisk,
  integritee,
  karura,
  robonomics,
  tinkernet,
};
