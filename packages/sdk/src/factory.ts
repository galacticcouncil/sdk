import { ApiPromise } from '@polkadot/api';

import { AaveUtils } from './aave';
import { AssetClient, BalanceClient, ChainParams } from './client';
import { EvmClient } from './evm';
import { CachingPoolService, PoolService } from './pool';
import { TradeRouter, TradeScheduler } from './sor';
import { TxBuilderFactory } from './tx';

export type SdkCtx = {
  api: {
    aave: AaveUtils;
    router: TradeRouter;
    scheduler: TradeScheduler;
  };
  client: {
    asset: AssetClient;
    balance: BalanceClient;
    evm: EvmClient;
  };
  ctx: {
    pool: PoolService;
  };
  tx: TxBuilderFactory;
  destroy: () => void;
};

export function createSdkContext(
  api: ApiPromise,
  evmClient?: EvmClient
): SdkCtx {
  const params = new ChainParams(api);

  const evm = evmClient ?? new EvmClient();

  // Initialize pool context
  const poolCtx = new CachingPoolService(api);

  // Initialize APIs
  const aave = new AaveUtils(evm);
  const router = new TradeRouter(poolCtx);
  const scheduler = new TradeScheduler(router, {
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
      evm: evm,
    },
    ctx: {
      pool: poolCtx,
    },
    tx: new TxBuilderFactory(api, evm),
    destroy: () => {
      poolCtx.destroy();
    },
  } as SdkCtx;
}
