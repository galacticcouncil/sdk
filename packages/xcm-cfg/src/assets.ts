import { Asset } from '@galacticcouncil/xcm-core';

export const aca = new Asset({
  key: 'aca',
  originSymbol: 'ACA',
});

export const astr = new Asset({
  key: 'astr',
  originSymbol: 'ASTR',
});

export const bnc = new Asset({
  key: 'bnc',
  originSymbol: 'BNC',
});

export const bsx = new Asset({
  key: 'bsx',
  originSymbol: 'BSX',
});

export const cfg = new Asset({
  key: 'cfg',
  originSymbol: 'CFG',
});

export const cru = new Asset({
  key: 'cru',
  originSymbol: 'CRU',
});

export const dai = new Asset({
  key: 'dai',
  originSymbol: 'DAI',
});

export const dai_awh = new Asset({
  ...dai,
  key: 'dai_awh',
});

export const dai_mwh = new Asset({
  ...dai,
  key: 'dai_mwh',
});

export const ded = new Asset({
  key: 'ded',
  originSymbol: 'DED',
});

export const dot = new Asset({
  key: 'dot',
  originSymbol: 'DOT',
});

export const dota = new Asset({
  key: 'dota',
  originSymbol: 'DOTA',
});

export const eth = new Asset({
  key: 'eth',
  originSymbol: 'ETH',
});

export const glmr = new Asset({
  key: 'glmr',
  originSymbol: 'GLMR',
});

export const hdx = new Asset({
  key: 'hdx',
  originSymbol: 'HDX',
});

export const ibtc = new Asset({
  key: 'ibtc',
  originSymbol: 'IBTC',
});

export const intr = new Asset({
  key: 'intr',
  originSymbol: 'INTR',
});

export const kar = new Asset({
  key: 'kar',
  originSymbol: 'KAR',
});

export const ksm = new Asset({
  key: 'ksm',
  originSymbol: 'KSM',
});

export const nodl = new Asset({
  key: 'nodl',
  originSymbol: 'NODL',
});

export const pha = new Asset({
  key: 'pha',
  originSymbol: 'PHA',
});

export const pink = new Asset({
  key: 'pink',
  originSymbol: 'PINK',
});

export const sub = new Asset({
  key: 'sub',
  originSymbol: 'SUB',
});

export const teer = new Asset({
  key: 'teer',
  originSymbol: 'TEER',
});

export const tnkr = new Asset({
  key: 'tnkr',
  originSymbol: 'TNKR',
});

export const weth = new Asset({
  key: 'weth',
  originSymbol: 'WETH',
});

export const weth_awh = new Asset({
  ...weth,
  key: 'weth_awh',
});

export const weth_mwh = new Asset({
  ...weth,
  key: 'weth_mwh',
});

export const wbtc = new Asset({
  key: 'weth',
  originSymbol: 'WETH',
});

export const wbtc_awh = new Asset({
  ...wbtc,
  key: 'wbtc_awh',
});

export const wbtc_mwh = new Asset({
  ...wbtc,
  key: 'wbtc_mwh',
});

export const unq = new Asset({
  key: 'unq',
  originSymbol: 'UNQ',
});

export const usdt = new Asset({
  key: 'usdt',
  originSymbol: 'USDT',
});

export const usdt_mwh = new Asset({
  ...usdt,
  key: 'usdt_mwh',
});

export const usdc = new Asset({
  key: 'usdc',
  originSymbol: 'USDC',
});

export const usdc_mwh = new Asset({
  ...usdc,
  key: 'usdc_mwh',
});

export const vdot = new Asset({
  key: 'vdot',
  originSymbol: 'vDOT',
});

export const ztg = new Asset({
  key: 'ztg',
  originSymbol: 'ZTG',
});

export const xrt = new Asset({
  key: 'xrt',
  originSymbol: 'XRT',
});

export const assets: Asset[] = [
  aca,
  astr,
  bsx,
  cfg,
  cru,
  bnc,
  dai,
  dai_awh,
  dai_mwh,
  ded,
  dot,
  dota,
  eth,
  glmr,
  hdx,
  ibtc,
  intr,
  kar,
  ksm,
  nodl,
  pha,
  pink,
  sub,
  teer,
  tnkr,
  unq,
  usdc,
  usdc_mwh,
  usdt,
  usdt_mwh,
  vdot,
  wbtc,
  wbtc_awh,
  wbtc_mwh,
  weth,
  weth_awh,
  weth_mwh,
  ztg,
  xrt,
];

export const assetsMap = new Map<string, Asset>(
  assets.map((asset) => [asset.key, asset])
);
