import {
  assetsMap,
  chainsMap,
  routesMap,
  swaps,
  validations,
  HydrationConfigService,
} from '@galacticcouncil/xcm-cfg';

import { Wallet, WormholeClient, WormholeScan } from '@galacticcouncil/xcm-sdk';

import { externals } from './externals';

// Initialize config
export const configService = new HydrationConfigService({
  assets: assetsMap,
  chains: chainsMap,
  routes: routesMap,
});

// Initialize wallet
export const wallet = new Wallet({
  configService: configService,
  transferValidations: validations,
});

// Initialize clients
export const whScan = new WormholeScan();
export const whClient = new WormholeClient();

// Register external assets
configService.registerExternal(externals);

// Register chain swaps
const hydration = configService.getChain('hydration');
const assethub = configService.getChain('assethub');

wallet.registerSwaps(
  new swaps.HydrationSwap(hydration),
  new swaps.AssethubSwap(assethub)
);
