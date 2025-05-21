import { ApiPromise } from '@polkadot/api';

import { AssetClient, BalanceClient } from './client';
import { CachingPoolService, PoolService } from './pool';
import { TradeRouter, TradeScheduler, TradeUtils } from './sor';

export type SdkCtx = {
  assetClient: AssetClient;
  balanceClient: BalanceClient;
  poolService: PoolService;
  tradeRouter: TradeRouter;
  tradeScheduler: TradeScheduler;
  tradeUtils: TradeUtils;
};

export function createSdkContext(api: ApiPromise): SdkCtx {
  const assetClient = new AssetClient(api);
  const balanceClient = new BalanceClient(api);

  const poolService = new CachingPoolService(api);
  const tradeUtils = new TradeUtils(api);
  const tradeRouter = new TradeRouter(poolService, tradeUtils);
  const tradeScheduler = new TradeScheduler(api, tradeRouter);

  return {
    assetClient,
    balanceClient,
    poolService,
    tradeRouter,
    tradeScheduler,
    tradeUtils,
  } as SdkCtx;
}
