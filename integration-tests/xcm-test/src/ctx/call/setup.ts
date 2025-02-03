import {
  assetsMap,
  chainsMap,
  routesMap,
  validations,
  dex,
  HydrationConfigService,
} from '@galacticcouncil/xcm-cfg';

import { Wallet } from '@galacticcouncil/xcm-sdk';

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
  const hydration = configService.getChain('hydration');
  const assethub = configService.getChain('assethub');

  wallet.registerDex(
    new dex.HydrationDex(hydration),
    new dex.AssethubDex(assethub)
  );

  return wallet;
};
