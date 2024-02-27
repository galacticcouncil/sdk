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
  intr,
  usdc,
  usdt,
  vdot,
  wbtc,
  weth,
  ztg,
} from '@moonbeam-network/xcm-config';

export {
  aca,
  astr,
  bnc,
  cfg,
  dot,
  glmr,
  hdx,
  intr,
  ibtc,
  usdc,
  usdt,
  vdot,
  ztg,
};

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

export const usdt_mwh = new Asset({
  ...usdt,
  key: 'usdt_mwh',
});

export const usdc_mwh = new Asset({
  ...usdc,
  key: 'usdc_mwh',
});

export const sub = new Asset({
  key: 'sub',
  originSymbol: 'SUB',
});

export const pha = new Asset({
  key: 'pha',
  originSymbol: 'PHA',
});

export const nodl = new Asset({
  key: 'nodl',
  originSymbol: 'NODL',
});

export const unq = new Asset({
  key: 'unq',
  originSymbol: 'UNQ',
});

export const cru = new Asset({
  key: 'cru',
  originSymbol: 'CRU',
});

export const assets: Asset[] = [
  aca,
  astr,
  cfg,
  cru,
  bnc,
  dai_awh,
  dai_mwh,
  dot,
  glmr,
  hdx,
  ibtc,
  intr,
  nodl,
  sub,
  unq,
  usdc,
  usdc_mwh,
  usdt,
  usdt_mwh,
  vdot,
  wbtc_awh,
  wbtc_mwh,
  weth_awh,
  weth_mwh,
  ztg,
  pha,
];

export const assetsMap = new Map<string, Asset>(
  assets.map((asset) => [asset.key, asset])
);
