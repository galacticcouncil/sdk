import { createSdkContext } from '@galacticcouncil/sdk';
import {
  assetsMap,
  chainsMap,
  routesMap,
  dex,
  validations,
  HydrationConfigService,
} from '@galacticcouncil/xcm-cfg';
import { Parachain } from '@galacticcouncil/xcm-core';

import {
  Wallet,
  WormholeClient,
  WormholeScan,
  WormholeTransfer,
} from '@galacticcouncil/xcm-sdk';

import { externals } from './externals';

// Initialize config
export const configService = new HydrationConfigService({
  assets: assetsMap,
  chains: chainsMap,
  routes: routesMap,
});

// Init hydration sdk
const hydration = configService.getChain('hydration') as Parachain;
const hydrationApi = await hydration.api;
const hydrationSdk = createSdkContext(hydrationApi);

const { ctx } = hydrationSdk;

// Initialize wallet
export const wallet = new Wallet({
  configService: configService,
  transferValidations: validations,
});

// Initialize clients
export const whScan = new WormholeScan();
export const whClient = new WormholeClient();
export const whTransfers = new WormholeTransfer(configService, 2034);

// Register external assets
configService.registerExternal(externals);

// Register dex-es
const assethub = configService.getChain('assethub');
const assethubCex = configService.getChain('assethub_cex');

wallet.registerDex(
  new dex.HydrationDex(hydration, ctx.pool),
  new dex.AssethubDex(assethub),
  new dex.AssethubDex(assethubCex)
);
