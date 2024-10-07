import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import {
  dai,
  eth,
  wbtc,
  usdc,
  usdt,
  dai_mwh,
  weth_mwh,
  wbtc_mwh,
  usdc_mwh,
  usdt_mwh,
} from '../assets';
import { ethereum, hydration, moonbeam } from '../chains';
import { BalanceBuilder, ContractBuilder } from '../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: dai,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: eth,
        balance: BalanceBuilder().evm().native(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: hydration,
      asset: dai_mwh,
      fee: {
        amount: 0,
        asset: dai_mwh,
      },
    },
    contract: ContractBuilder().TokenBridge().transferTokensWithPayload().mrl(),
    via: {
      chain: moonbeam,
    },
  }),
  new AssetRoute({
    source: {
      asset: eth,
      balance: BalanceBuilder().evm().native(),
      destinationFee: {
        balance: BalanceBuilder().evm().native(),
      },
    },
    destination: {
      chain: hydration,
      asset: weth_mwh,
      fee: {
        amount: 0,
        asset: weth_mwh,
      },
    },
    contract: ContractBuilder()
      .TokenBridge()
      .wrapAndTransferETHWithPayload()
      .mrl(),
    via: {
      chain: moonbeam,
    },
  }),
  new AssetRoute({
    source: {
      asset: wbtc,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: eth,
        balance: BalanceBuilder().evm().native(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: hydration,
      asset: wbtc_mwh,
      fee: {
        amount: 0,
        asset: wbtc_mwh,
      },
    },
    contract: ContractBuilder().TokenBridge().transferTokensWithPayload().mrl(),
    via: {
      chain: moonbeam,
    },
  }),
  new AssetRoute({
    source: {
      asset: usdc,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: eth,
        balance: BalanceBuilder().evm().native(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: hydration,
      asset: usdc_mwh,
      fee: {
        amount: 0,
        asset: usdc_mwh,
      },
    },
    contract: ContractBuilder().TokenBridge().transferTokensWithPayload().mrl(),
    via: {
      chain: moonbeam,
    },
  }),
  new AssetRoute({
    source: {
      asset: usdt,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: eth,
        balance: BalanceBuilder().evm().native(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: hydration,
      asset: usdt_mwh,
      fee: {
        amount: 0,
        asset: usdt_mwh,
      },
    },
    contract: ContractBuilder().TokenBridge().transferTokensWithPayload().mrl(),
    via: {
      chain: moonbeam,
    },
  }),
];

const toMoonbeam: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: eth,
      balance: BalanceBuilder().evm().native(),
      destinationFee: {
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: moonbeam,
      asset: weth_mwh,
      fee: {
        amount: 0,
        asset: weth_mwh,
      },
    },
    contract: ContractBuilder()
      .TokenBridge()
      .wrapAndTransferETHWithPayload()
      .mrl(),
  }),
  new AssetRoute({
    source: {
      asset: dai,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: eth,
        balance: BalanceBuilder().evm().native(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: moonbeam,
      asset: dai_mwh,
      fee: {
        amount: 0,
        asset: dai_mwh,
      },
    },
    contract: ContractBuilder().TokenBridge().transferTokens(),
  }),
];

export const ethereumConfig = new ChainRoutes({
  chain: ethereum,
  routes: [...toHydration],
});
