import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import {
  dai,
  dai_mwh,
  eth,
  glmr,
  hdx,
  sol,
  susds_mwh,
  usdc,
  usdc_mwh,
  usdt,
  usdt_mwh,
  wbtc_mwh,
  weth_mwh,
} from '../../../assets';
import { assetHub, ethereum, hydration, moonbeam } from '../../../chains';
import {
  BalanceBuilder,
  ContractBuilder,
  FeeAmountBuilder,
} from '../../../builders';
import { Tag } from '../../../tags';

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
    contract: ContractBuilder().PolkadotXcm().transferAssetsToPara32(),
  }),
  toHydrationXcTemplate(hdx, 0.6),
  toHydrationXcTemplate(usdt, 0.3),
  toHydrationXcTemplate(usdc, 0.3),
  toHydrationErc20Template(dai_mwh, 0.004),
  toHydrationErc20Template(susds_mwh, 0.004),
  toHydrationErc20Template(usdc_mwh, 0.004),
  toHydrationErc20Template(usdt_mwh, 0.004),
  toHydrationErc20Template(wbtc_mwh, 0.0000001),
  toHydrationErc20Template(weth_mwh, 0.000002),
  toHydrationErc20Template(sol, 0.00002),
];

const toAssetHub: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: usdt,
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
      asset: usdt,
      fee: {
        amount: 0.18,
        asset: usdt,
      },
    },
    contract: ContractBuilder().PolkadotXcm().transferAssetsToPara32(),
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
    contract: ContractBuilder().PolkadotXcm().transferAssetsToPara32(),
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
        amount: FeeAmountBuilder()
          .Wormhole()
          .TokenRelayer()
          .calculateRelayerFee(),
        asset: eth,
      },
    },
    contract: ContractBuilder()
      .Batch()
      .batchAll([
        ContractBuilder()
          .Erc20()
          .approve((ctx) => ctx.getTokenRelayer()),
        ContractBuilder().Wormhole().TokenRelayer().transferTokensWithRelay(),
      ]),
    tags: [Tag.Mrl, Tag.Wormhole, Tag.Relayer],
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
        amount: FeeAmountBuilder()
          .Wormhole()
          .TokenRelayer()
          .calculateRelayerFee(),
        asset: dai,
      },
    },
    contract: ContractBuilder()
      .Batch()
      .batchAll([
        ContractBuilder()
          .Erc20()
          .approve((ctx) => ctx.getTokenRelayer()),
        ContractBuilder().Wormhole().TokenRelayer().transferTokensWithRelay(),
      ]),
    tags: [Tag.Mrl, Tag.Wormhole, Tag.Relayer],
  }),
];

export const moonbeamConfig = new ChainRoutes({
  chain: moonbeam,
  routes: [...toHydration, ...toAssetHub],
});
