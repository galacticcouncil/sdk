import { PolkadotClient } from 'polkadot-api';

import { AaveUtils } from './aave';
import { AssetClient, BalanceClient, ChainParams } from './client';
import { EvmClient } from './evm';
import { PoolContextProvider } from './pool';
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
    pool: PoolContextProvider;
  };
  tx: TxBuilderFactory;
  destroy: () => void;
};

export async function createSdkContext(
  client: PolkadotClient,
  evmClient?: EvmClient
): Promise<SdkCtx> {
  const params = new ChainParams(client);
  const [blockTime, minOrderBudget] = await Promise.all([
    params.getBlockTime(),
    params.getMinOrderBudget(),
  ]);

  const evm = evmClient ?? new EvmClient();

  // Initialize pool context
  const poolCtx = new PoolContextProvider(client)
    .withAave()
    .withOmnipool()
    .withStableswap()
    .withXyk();

  // Initialize APIs
  const aave = new AaveUtils(evm);
  const router = new TradeRouter(poolCtx);
  const scheduler = new TradeScheduler(router, {
    blockTime: blockTime,
    minBudgetInNative: minOrderBudget,
  });

  return {
    api: {
      aave,
      router,
      scheduler,
    },
    client: {
      asset: new AssetClient(client),
      balance: new BalanceClient(client),
      evm: evm,
    },
    ctx: {
      pool: poolCtx,
    },
    tx: new TxBuilderFactory(client, evm),
    destroy: () => {
      poolCtx.destroy();
    },
  } as SdkCtx;
}
