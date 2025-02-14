import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import {
  dai,
  dai_mwh,
  eth,
  weth,
  wbtc,
  wbtc_mwh,
  weth_mwh,
  usdc,
  usdc_mwh,
  usdt,
  usdt_mwh,
  aave,
  susde,
  tbtc,
  ldo,
  link,
  sky,
  wsteth,
} from '../../../assets';
import { ethereum, hydration, moonbeam } from '../../../chains';
import { BalanceBuilder, ContractBuilder } from '../../../builders';
import { Tag } from '../../../tags';

import {
  toHydrationViaWormholeTemplate,
  toHydrationViaSnowbridgeTemplate,
} from './templates';

const toHydrationViaWormhole: AssetRoute[] = [
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
      .Wormhole()
      .TokenBridge()
      .wrapAndTransferETHWithPayload()
      .viaMrl({ moonchain: moonbeam }),
    tags: [Tag.Mrl, Tag.Wormhole],
  }),
  toHydrationViaWormholeTemplate(dai, dai_mwh),
  toHydrationViaWormholeTemplate(wbtc, wbtc_mwh),
  toHydrationViaWormholeTemplate(usdc, usdc_mwh),
  toHydrationViaWormholeTemplate(usdt, usdt_mwh),
];

const toHydrationViaSnowbridge: AssetRoute[] = [
  toHydrationViaSnowbridgeTemplate(weth, weth),
  toHydrationViaSnowbridgeTemplate(aave, aave),
  toHydrationViaSnowbridgeTemplate(susde, susde),
  toHydrationViaSnowbridgeTemplate(tbtc, tbtc),
  toHydrationViaSnowbridgeTemplate(ldo, ldo),
  toHydrationViaSnowbridgeTemplate(link, link),
  toHydrationViaSnowbridgeTemplate(sky, sky),
  toHydrationViaSnowbridgeTemplate(wsteth, wsteth),
];

const toMoonbeamViaWormhole: AssetRoute[] = [
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
    contract: ContractBuilder().Wormhole().TokenBridge().wrapAndTransferETH(),
    tags: [Tag.Mrl, Tag.Wormhole],
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
    contract: ContractBuilder().Wormhole().TokenBridge().transferTokens(),
    tags: [Tag.Mrl, Tag.Wormhole],
  }),
];

export const ethereumConfig = new ChainRoutes({
  chain: ethereum,
  routes: [...toHydrationViaWormhole, ...toHydrationViaSnowbridge],
});
