import { PoolService } from '@galacticcouncil/sdk';

import {
  assetsMap,
  chainsMap,
  routesMap,
  swaps,
  validations,
  HydrationConfigService,
} from '@galacticcouncil/xcm-cfg';
import { Wallet } from '@galacticcouncil/xcm-sdk';

import { SetupCtx } from './types';

export const configService = new HydrationConfigService({
  assets: assetsMap,
  chains: chainsMap,
  routes: routesMap,
});

export const initWithCtx = async (ctx: SetupCtx): Promise<Wallet> => {
  // Initialize pool service with chopsticks ctx
  const poolService = new PoolService(ctx.api);

  const wallet = new Wallet({
    configService: configService,
    transferValidations: validations,
  });

  // Register chain swaps
  const hydration = configService.getChain('hydration');
  const assethub = configService.getChain('assethub');

  wallet.registerSwaps(
    new swaps.HydrationSwap(hydration, poolService),
    new swaps.AssethubSwap(assethub)
  );

  return wallet;
};
