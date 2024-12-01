import { PoolService } from '@galacticcouncil/sdk';

import {
  assetsMap,
  chainsMap,
  routesMap,
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
  return new Wallet({
    configService: configService,
    poolService: poolService,
    transferValidations: validations,
  });
};
