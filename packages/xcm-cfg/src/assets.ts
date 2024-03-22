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
  kar,
  ksm,
  teer,
  usdc,
  usdt,
  vdot,
  wbtc,
  weth,
  ztg,
  xrt,
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
  kar,
  ksm,
  teer,
  usdc,
  usdt,
  vdot,
  ztg,
  xrt,
};

export const bsx = new Asset({
  key: 'bsx',
  originSymbol: 'BSX',
});

export const cru = new Asset({
  key: 'cru',
  originSymbol: 'CRU',
});

export const dai_awh = new Asset({
  ...dai,
  key: 'dai_awh',
});

export const dai_mwh = new Asset({
  ...dai,
  key: 'dai_mwh',
});

export const nodl = new Asset({
  key: 'nodl',
  originSymbol: 'NODL',
});

export const pha = new Asset({
  key: 'pha',
  originSymbol: 'PHA',
});

export const tnkr = new Asset({
  key: 'tnkr',
  originSymbol: 'TNKR',
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

export const unq = new Asset({
  key: 'unq',
  originSymbol: 'UNQ',
});

export const pink = new Asset({
  key: 'pink',
  originSymbol: 'PINK',
});

export const assets: Asset[] = [
  aca,
  astr,
  bsx,
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
  kar,
  ksm,
  nodl,
  pha,
  sub,
  teer,
  tnkr,
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
  xrt,
  pink,
];

export const assetsMap = new Map<string, Asset>(
  assets.map((asset) => [asset.key, asset])
);
