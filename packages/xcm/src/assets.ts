import { Asset } from '@moonbeam-network/xcm-types';
import {
  aca,
  astr,
  bnc,
  cfg,
  dai,
  dot,
  glmr,
  hdx,
  ibtc,
  usdc,
  usdt,
  wbtc,
  weth,
  ztg,
} from '@moonbeam-network/xcm-config';

export { aca, astr, bnc, cfg, dot, glmr, hdx, ibtc, usdc, usdt, ztg };

export const dai_awh = new Asset({
  ...dai,
  key: 'dai_awh',
});

export const dai_mwh = new Asset({
  ...dai,
  key: 'dai_mwh',
});

export const weth_awh = new Asset({
  ...weth,
  key: 'weth_awh',
});

export const weth_mwh = new Asset({
  ...weth,
  key: 'weth_mwh',
});

export const wbtc_awh = new Asset({
  ...wbtc,
  key: 'wbtc_awh',
});

export const wbtc_mwh = new Asset({
  ...wbtc,
  key: 'wbtc_mwh',
});

export const sub = new Asset({
  key: 'sub',
  originSymbol: 'SUB',
});

export const assets: Asset[] = [
  aca,
  astr,
  cfg,
  bnc,
  dai_awh,
  dai_mwh,
  dot,
  glmr,
  hdx,
  ibtc,
  sub,
  usdc,
  usdt,
  wbtc_awh,
  wbtc_mwh,
  weth_awh,
  weth_mwh,
  ztg,
];

export const assetsMap = new Map<string, Asset>(
  assets.map((asset) => [asset.key, asset])
);
