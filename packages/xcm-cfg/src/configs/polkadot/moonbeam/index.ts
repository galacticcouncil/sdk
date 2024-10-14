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
} from '../../../assets';
import {
  acala,
  assetHub,
  ethereum,
  hydration,
  moonbeam,
} from '../../../chains';
import {
  BalanceBuilder,
  ContractBuilder,
  FeeAmountBuilder,
} from '../../../builders';

import { toHydrationErc20Template, toHydrationXcTemplate } from './templates';

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
  toHydrationXcTemplate(hdx, 0.6),
  toHydrationXcTemplate(dot, 0.1),
  toHydrationErc20Template(dai_mwh, 0.004),
  toHydrationErc20Template(usdc_mwh, 0.004),
  toHydrationErc20Template(usdt_mwh, 0.004),
  toHydrationErc20Template(wbtc_mwh, 0.0000001),
  toHydrationErc20Template(weth_mwh, 0.000002),
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
