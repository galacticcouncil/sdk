import { EvmClient, PoolService } from '@galacticcouncil/sdk';
import {
  assetsMap,
  chainsMap,
  routesMap,
  validations,
  dex,
  HydrationConfigService,
} from '@galacticcouncil/xcm-cfg';
import { Parachain } from '@galacticcouncil/xcm-core';

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

  const hdx = hydration as Parachain;
  const hdxApi = await hdx.api;

  // Initialize pool service with chopsticks ctx
  const poolService = new PoolService(hdxApi, new EvmClient(hdxApi));

  wallet.registerDex(
    new dex.HydrationDex(hydration, poolService),
    new dex.AssethubDex(assethub)
  );

  return wallet;
};
