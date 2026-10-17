import { ChainRoutes } from '@galacticcouncil/xc-core';

import { evmChainsConfig } from './evm';
import { nearChainsConfig } from './near';
import { polkadotChainsConfig } from './polkadot';
import { solanaChainsConfig } from './solana';
import { suiChainsConfig } from './sui';
import { zcashChainsConfig } from './zcash';

import { kusamaChainsConfig } from './kusama';

export const routes: ChainRoutes[] = [
  ...evmChainsConfig,
  ...nearChainsConfig,
  ...polkadotChainsConfig,
  ...solanaChainsConfig,
  ...suiChainsConfig,
  ...zcashChainsConfig,
  ...kusamaChainsConfig,
];

export const routesMap = new Map<string, ChainRoutes>(
  routes.map((route) => [route.chain.key, route])
);
