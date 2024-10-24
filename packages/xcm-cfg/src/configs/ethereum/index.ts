import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import {
  dai,
  dai_mwh,
  eth,
  wbtc,
  wbtc_mwh,
  weth_mwh,
  usdc,
  usdc_mwh,
  usdt,
  usdt_mwh,
} from '../../assets';
import { ethereum, hydration, moonbeam } from '../../chains';
import { BalanceBuilder, ContractBuilder } from '../../builders';

import { toHydrationErc20Template } from './templates';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: eth,
      balance: BalanceBuilder().evm().native(),
      destinationFee: {
        asset: eth,
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
      .viaMrl({ moonchain: moonbeam }),
  }),
  toHydrationErc20Template(dai, dai_mwh),
  toHydrationErc20Template(wbtc, wbtc_mwh),
  toHydrationErc20Template(usdc, usdc_mwh),
  toHydrationErc20Template(usdt, usdt_mwh),
];

const toMoonbeam: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: eth,
      balance: BalanceBuilder().evm().native(),
      destinationFee: {
        asset: eth,
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
    contract: ContractBuilder().TokenBridge().wrapAndTransferETH(),
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
        asset: dai,
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
