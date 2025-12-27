import { EvmClient, PoolService } from '@galacticcouncil/sdk';

import {
  assetsMap,
  chainsMap,
  routesMap,
  dex,
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
  const poolService = new PoolService(ctx.api, new EvmClient(ctx.api));

  const wallet = new Wallet({
    configService: configService,
    transferValidations: validations,
  });

  // Register dex-es
  const hydration = configService.getChain('hydration');
  const assethub = configService.getChain('assethub');

  wallet.registerDex(
    new dex.HydrationDex(hydration, poolService),
    new dex.AssethubDex(assethub)
  );

  return wallet;
};
