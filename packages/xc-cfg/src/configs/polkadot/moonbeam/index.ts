import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import {
  dai_mwh,
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
import { assetHub, hydration, moonbeam } from '../../../chains';
import { ContractBuilder } from '../../../builders';

import { toHydrationErc20Template, toHydrationXcTemplate } from './templates';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: glmr,
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
      fee: {
        asset: glmr,
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
      fee: {
        asset: glmr,
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

export const moonbeamConfig = new ChainRoutes({
  chain: moonbeam,
  routes: [...toHydration, ...toAssetHub],
});
