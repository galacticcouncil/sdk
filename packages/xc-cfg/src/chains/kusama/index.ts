import { AnyChain } from '@galacticcouncil/xc-core';

import { kusamaAssetHub } from './assethub';
import { basilisk } from './basilisk';

export const kusamaChains: AnyChain[] = [
  kusamaAssetHub,
  basilisk,
];

export {
  kusamaAssetHub,
  basilisk,
};
