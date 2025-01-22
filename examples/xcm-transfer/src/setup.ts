import {
  assetsMap,
  chainsMap,
  routesMap,
  dex,
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

// Register dex-es
const hydration = configService.getChain('hydration');
const assethub = configService.getChain('assethub');

wallet.registerDex(
  new dex.HydrationDex(hydration),
  new dex.AssethubDex(assethub)
);
