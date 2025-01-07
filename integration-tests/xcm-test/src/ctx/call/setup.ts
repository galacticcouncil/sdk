import {
  assetsMap,
  chainsMap,
  routesMap,
  validations,
  swaps,
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

  // Register chain swaps
  const hydration = configService.getChain('hydration');
  const assethub = configService.getChain('assethub');

  wallet.registerSwaps(
    new swaps.HydrationSwap(hydration),
    new swaps.AssethubSwap(assethub)
  );

  return wallet;
};
