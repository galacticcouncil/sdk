import { AnyChain } from '@galacticcouncil/xcm-core';

import { kusamaAssetHub } from './assethub';
import { basilisk } from './basilisk';
import { integritee } from './integritee';
import { karura } from './karura';
import { kusama } from './kusama';
import { robonomics } from './robonomics';
import { tinkernet } from './tinkernet';
import { xode } from './xode';

export const kusamaChains: AnyChain[] = [
  kusama,
  kusamaAssetHub,
  basilisk,
  integritee,
  karura,
  robonomics,
  tinkernet,
  xode,
];

export {
  kusama,
  kusamaAssetHub,
  basilisk,
  integritee,
  karura,
  robonomics,
  tinkernet,
  xode,
};
