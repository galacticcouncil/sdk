import { AnyChain } from '@galacticcouncil/xc-core';

import { assetHub, assetHubCex } from './assethub';
import { astar } from './astar';
import { bifrost } from './bifrost';
import { hydration } from './hydration';
import { mythos } from './mythos';
import { neuroweb } from './neuroweb';
import { pendulum } from './pendulum';
import { polkadot } from './polkadot';
import { unique } from './unique';
import { energywebx } from './energywebx';

export const polkadotChains: AnyChain[] = [
  assetHub,
  assetHubCex,
  astar,
  bifrost,
  hydration,
  neuroweb,
  mythos,
  pendulum,
  polkadot,
  unique,
  energywebx,
];

export {
  assetHub,
  assetHubCex,
  astar,
  bifrost,
  hydration,
  neuroweb,
  mythos,
  pendulum,
  polkadot,
  unique,
  energywebx,
};
