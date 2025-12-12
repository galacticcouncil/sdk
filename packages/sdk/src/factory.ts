import { ApiPromise } from '@polkadot/api';

import { AaveUtils } from './aave';
import {
  AssetClient,
  BalanceClient,
  ChainParams,
  BalanceClientV2,
} from './client';
import { EvmClient } from './evm';
import { CachingPoolService, PoolService, PoolType } from './pool';
import { RouterOptions, TradeRouter, TradeScheduler } from './sor';
import { TxBuilderFactory } from './tx';

const DEFAULT_OPTS = { router: {} };

export type SdkCtx = {
  api: {
    aave: AaveUtils;
    router: TradeRouter;
    scheduler: TradeScheduler;
  };
  client: {
    asset: AssetClient;
    balance: BalanceClient;
    balanceV2: BalanceClientV2;
  };
  ctx: {
    pool: PoolService;
  };
  evm: EvmClient;
  tx: TxBuilderFactory;
  destroy: () => void;
};

export function createSdkContext(
  api: ApiPromise,
  opts: { router: RouterOptions } = DEFAULT_OPTS
): SdkCtx {
  const params = new ChainParams(api);
  const evm = new EvmClient(api);

  // Initialize pool context
  const poolCtx = new CachingPoolService(api, evm);

  // Initialize APIs
  const aave = new AaveUtils(evm);
  const router = new TradeRouter(poolCtx, opts.router);

  const schedulerRouter = new TradeRouter(poolCtx, { exclude: [PoolType.HSM] });
  const scheduler = new TradeScheduler(schedulerRouter, {
    blockTime: params.blockTime,
    minBudgetInNative: params.minOrderBudget,
  });

  return {
    api: {
      aave,
      router,
      scheduler,
    },
    client: {
      asset: new AssetClient(api),
      balance: new BalanceClient(api),
      balanceV2: new BalanceClientV2(api),
    },
    ctx: {
      pool: poolCtx,
    },
    evm: evm,
    tx: new TxBuilderFactory(api, evm),
    destroy: () => {
      poolCtx.destroy();
    },
  } as SdkCtx;
}
