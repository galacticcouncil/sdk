import { createSdkContext } from '@galacticcouncil/sdk-next';
import {
  assetsMap,
  chainsMap,
  routesMap,
  validations,
  dex,
  HydrationConfigService,
} from '@galacticcouncil/xc-cfg';
import { Parachain } from '@galacticcouncil/xc-core';

import { Wallet } from '@galacticcouncil/xc-sdk';

export const configService = new HydrationConfigService({
  assets: assetsMap,
  chains: chainsMap,
  routes: routesMap,
});

export const init = async (): Promise<Wallet> => {
  const wallet = new Wallet({
    configService: configService,
    transferValidations: validations,
  });

  // Register dex-es
  const hydration = configService.getChain('hydration') as Parachain;
  const assethub = configService.getChain('assethub') as Parachain;

  // Init hydration sdk context
  const hydrationClient = hydration.client;
  const hydrationSdk = await createSdkContext(hydrationClient);

  const { ctx } = hydrationSdk;

  // Register dexes on chains
  const hydrationDex = new dex.HydrationDex(hydration, ctx.pool);
  hydration.registerDex(hydrationDex);

  const assethubDex = new dex.AssethubDex(assethub);
  assethub.registerDex(assethubDex);

  return wallet;
};
