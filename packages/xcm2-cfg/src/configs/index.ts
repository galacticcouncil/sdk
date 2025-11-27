import { ChainRoutes } from '@galacticcouncil/xcm2-core';

import { evmChainsConfig } from './evm';
import { polkadotChainsConfig } from './polkadot';
import { solanaChainsConfig } from './solana';
import { suiChainsConfig } from './sui';

import { kusamaChainsConfig } from './kusama';

export const routes: ChainRoutes[] = [
  ...evmChainsConfig,
  ...polkadotChainsConfig,
  ...solanaChainsConfig,
  ...suiChainsConfig,
  ...kusamaChainsConfig,
];

export const routesMap = new Map<string, ChainRoutes>(
  routes.map((route) => [route.chain.key, route])
);
