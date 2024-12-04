import { PoolService } from '@galacticcouncil/sdk';

import {
  assetsMap,
  chainsMap,
  routesMap,
  validations,
  HydrationConfigService,
} from '@galacticcouncil/xcm-cfg';
import { EvmParachain } from '@galacticcouncil/xcm-core';
import { Wallet } from '@galacticcouncil/xcm-sdk';

export const configService = new HydrationConfigService({
  assets: assetsMap,
  chains: chainsMap,
  routes: routesMap,
});

export const init = async (): Promise<Wallet> => {
  // Initialize hydration API
  const hydration = configService.getChain('hydration') as EvmParachain;
  const hydrationApi = await hydration.api;

  // Initialize pool service (DEX)
  const poolService = new PoolService(hydrationApi);

  return new Wallet({
    configService: configService,
    poolService: poolService,
    transferValidations: validations,
  });
};
