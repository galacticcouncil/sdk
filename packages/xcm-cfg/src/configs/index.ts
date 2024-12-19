import { ChainRoutes } from '@galacticcouncil/xcm-core';

import { evmChainsConfig } from './evm';
import { polkadotChainsConfig } from './polkadot';
import { kusamaChainsConfig } from './kusama';

export const routes: ChainRoutes[] = [
  ...evmChainsConfig,
  ...polkadotChainsConfig,
  ...kusamaChainsConfig,
];

export const routesMap = new Map<string, ChainRoutes>(
  routes.map((route) => [route.chain.key, route])
);
