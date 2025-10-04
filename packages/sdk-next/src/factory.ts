import { PolkadotClient } from 'polkadot-api';

import { AaveUtils } from './aave';
import { AssetClient, BalanceClient, ChainParams } from './client';
import { EvmClient } from './evm';
import { LiquidityMiningApi, LiquidityMiningClient } from './farm';
import { PoolContextProvider } from './pool';
import { TradeRouter, TradeScheduler } from './sor';
import { StakingApi, StakingClient } from './staking';

import { TxBuilderFactory } from './tx';

export type SdkCtx = {
  api: {
    aave: AaveUtils;
    router: TradeRouter;
    scheduler: TradeScheduler;
    staking: StakingApi;
    farm: LiquidityMiningApi;
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
  client: PolkadotClient
): Promise<SdkCtx> {
  const params = new ChainParams(client);
  const evm = new EvmClient(client);

  const [blockTime, minOrderBudget] = await Promise.all([
    params.getBlockTime(),
    params.getMinOrderBudget(),
  ]);

  // Initialize pool context
  const poolCtx = new PoolContextProvider(client, evm);

  // Initialize clients
  const balance = new BalanceClient(client);
  const stakingClient = new StakingClient(client);
  const farmClient = new LiquidityMiningClient(client);

  // Initialize APIs
  const aave = new AaveUtils(evm);
  const router = new TradeRouter(poolCtx);
  const scheduler = new TradeScheduler(router, {
    blockTime: blockTime,
    minBudgetInNative: minOrderBudget,
  });

  const staking = new StakingApi(stakingClient, balance);
  const farm = new LiquidityMiningApi(farmClient, balance, {
    blockTime: blockTime,
  });

  return {
    api: {
      aave,
      router,
      scheduler,
      staking,
      farm,
    },
    client: {
      asset: new AssetClient(client),
      balance: balance,
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
