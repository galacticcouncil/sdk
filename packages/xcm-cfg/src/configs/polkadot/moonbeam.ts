import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import {
  aca,
  dai,
  dai_awh,
  dai_mwh,
  dot,
  eth,
  glmr,
  hdx,
  pink,
  usdc,
  usdc_mwh,
  usdt,
  usdt_mwh,
  wbtc_mwh,
  weth_mwh,
} from '../../assets';
import { acala, assetHub, ethereum, hydration, moonbeam } from '../../chains';
import {
  BalanceBuilder,
  ContractBuilder,
  FeeAmountBuilder,
} from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: glmr,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: glmr,
      fee: {
        amount: 0.05,
        asset: glmr,
      },
    },
    contract: ContractBuilder().Xtokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: hdx,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: glmr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: hdx,
      fee: {
        amount: 0.6,
        asset: hdx,
      },
    },
    contract: ContractBuilder().Xtokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: dai_mwh,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: glmr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: hydration,
      asset: dai_mwh,
      fee: {
        amount: 0.004,
        asset: dai_mwh,
      },
    },
    contract: ContractBuilder().Xtokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: usdc_mwh,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: glmr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: hydration,
      asset: usdc_mwh,
      fee: {
        amount: 0.004,
        asset: usdc_mwh,
      },
    },
    contract: ContractBuilder().Xtokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: usdt_mwh,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: glmr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: hydration,
      asset: usdt_mwh,
      fee: {
        amount: 0.004,
        asset: usdc_mwh,
      },
    },
    contract: ContractBuilder().Xtokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: wbtc_mwh,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: glmr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: hydration,
      asset: wbtc_mwh,
      fee: {
        amount: 0.0000001,
        asset: wbtc_mwh,
      },
    },
    contract: ContractBuilder().Xtokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: weth_mwh,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: glmr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: hydration,
      asset: weth_mwh,
      fee: {
        amount: 0.000002,
        asset: weth_mwh,
      },
    },
    contract: ContractBuilder().Xtokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: dot,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: glmr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: dot,
      fee: {
        amount: 0.1,
        asset: dot,
      },
    },
    contract: ContractBuilder().Xtokens().transfer(),
  }),
];

const toAssetHub: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: pink,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: glmr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
    },
    destination: {
      chain: assetHub,
      asset: pink,
      fee: {
        amount: 0.18,
        asset: usdt,
      },
    },
    contract: ContractBuilder().Xtokens().transferMultiCurrencies(),
  }),
  new AssetRoute({
    source: {
      asset: usdt,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: glmr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
    },
    destination: {
      chain: assetHub,
      asset: usdt,
      fee: {
        amount: 0.18,
        asset: usdt,
      },
    },
    contract: ContractBuilder().Xtokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: usdc,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: glmr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: assetHub,
      asset: usdc,
      fee: {
        amount: 0.18,
        asset: usdc,
      },
    },
    contract: ContractBuilder().Xtokens().transfer(),
  }),
];

const toAcalaViaWormhole: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: dai_mwh,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: glmr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
    },
    destination: {
      chain: acala,
      asset: dai_awh,
      fee: {
        amount: 0.05,
        asset: aca,
      },
    },
    contract: ContractBuilder()
      .Batch()
      .batchAll([
        ContractBuilder().Erc20().approve(),
        ContractBuilder().TokenBridge().transferTokens(),
      ]),
  }),
];

const toEthereumViaWormhole: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: weth_mwh,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: glmr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        asset: weth_mwh,
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: ethereum,
      asset: eth,
      fee: {
        amount: FeeAmountBuilder().TokenRelayer().calculateRelayerFee(),
        asset: eth,
      },
    },
    contract: ContractBuilder()
      .Batch()
      .batchAll([
        ContractBuilder().Erc20().approve(),
        ContractBuilder().TokenRelayer().transferTokensWithRelay(),
      ]),
  }),
  new AssetRoute({
    source: {
      asset: dai_mwh,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: glmr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        asset: dai_mwh,
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: ethereum,
      asset: dai,
      fee: {
        amount: FeeAmountBuilder().TokenRelayer().calculateRelayerFee(),
        asset: dai,
      },
    },
    contract: ContractBuilder()
      .Batch()
      .batchAll([
        ContractBuilder().Erc20().approve(),
        ContractBuilder().TokenRelayer().transferTokensWithRelay(),
      ]),
  }),
];

export const moonbeamConfig = new ChainRoutes({
  chain: moonbeam,
  routes: [...toHydration, ...toAssetHub],
});
