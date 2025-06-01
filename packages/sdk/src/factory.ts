import { ApiPromise } from '@polkadot/api';

import { AaveUtils } from './aave';
import { AssetClient, BalanceClient, ChainParams } from './client';
import { EvmClient } from './evm';
import { CachingPoolService, PoolService } from './pool';
import { TradeRouter, TradeScheduler, TxBuilder } from './sor';

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
  tx: TxBuilder;
  destroy: () => void;
};

export function createSdkContext(
  api: ApiPromise,
  evmClient?: EvmClient
): SdkCtx {
  const evm = evmClient ?? new EvmClient();

  const poolCtx = new CachingPoolService(api);

  const params = new ChainParams(api);

  const aave = new AaveUtils(evm);
  const router = new TradeRouter(poolCtx);
  const scheduler = new TradeScheduler(router, {
    blockTime: params.blockTime,
    minBudgetInNative: params.minOrderBudget,
  });

  const tx = new TxBuilder(api, evm);

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
    tx,
    destroy: () => {
      poolCtx.destroy();
    },
  } as SdkCtx;
}
