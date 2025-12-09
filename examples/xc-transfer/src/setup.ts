import { createSdkContext } from '@galacticcouncil/sdk-next';
import {
  assetsMap,
  chainsMap,
  routesMap,
  dex,
  validations,
  HydrationConfigService,
} from '@galacticcouncil/xc-cfg';
import { Parachain } from '@galacticcouncil/xc-core';

import {
  Wallet,
  WormholeScan,
  WormholeTransfer,
} from '@galacticcouncil/xc-sdk';

import { externals } from './externals';

// Initialize config
export const configService = new HydrationConfigService({
  assets: assetsMap,
  chains: chainsMap,
  routes: routesMap,
});

// Initialize clients
export const whScan = new WormholeScan();
export const whTransfers = new WormholeTransfer(configService, 2034);

// Get chain ctx
const hydration = configService.getChain('hydration') as Parachain;
const assethub = configService.getChain('assethub') as Parachain;
const assethubCex = configService.getChain('assethub_cex') as Parachain;

// Init hydration sdk
const hydrationClient = hydration.client;
const hydrationSdk = await createSdkContext(hydrationClient);

const { ctx } = hydrationSdk;

// Initialize wallet
export const wallet = new Wallet({
  configService: configService,
  transferValidations: validations,
});

// Register external assets
configService.registerExternal(externals);

// Register dex-es
const hydrationDex = new dex.HydrationDex(hydration, ctx.pool);
hydration.registerDex(hydrationDex);

const assethubDex = new dex.AssethubDex(assethub);
assethub.registerDex(assethubDex);
assethubCex.registerDex(assethubDex);
