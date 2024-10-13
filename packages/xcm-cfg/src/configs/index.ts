import { ChainRoutes } from '@galacticcouncil/xcm-core';

import { kusamaChainsConfig } from './kusama';
import { polkadotChainsConfig } from './polkadot';
import { ethereumConfig } from './ethereum';

export const routes: ChainRoutes[] = [
  ...kusamaChainsConfig,
  ...polkadotChainsConfig,
  ethereumConfig,
];

export const routesMap = new Map<string, ChainRoutes>(
  routes.map((route) => [route.chain.key, route])
);
