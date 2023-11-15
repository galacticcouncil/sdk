import { Asset } from '@moonbeam-network/xcm-types';
import { aca, astr, bnc, cfg, dai, dot, glmr, hdx, ibtc, usdt, wbtc, weth, ztg } from '@moonbeam-network/xcm-config';

export { aca, astr, bnc, cfg, dot, glmr, hdx, ibtc, usdt, ztg };

export const daiAcala = new Asset({
  ...dai,
  key: 'dai-acala',
});

export const daiMoonbeam = new Asset({
  ...dai,
  key: 'dai-moonbeam',
});

export const wethAcala = new Asset({
  ...weth,
  key: 'weth-acala',
});

export const wethMoonbeam = new Asset({
  ...weth,
  key: 'weth-moonbeam',
});

export const wbtcAcala = new Asset({
  ...wbtc,
  key: 'wbtc-acala',
});

export const wbtcMoonbeam = new Asset({
  ...wbtc,
  key: 'wbtc-moonbeam',
});

export const assets: Asset[] = [
  aca,
  astr,
  cfg,
  bnc,
  daiAcala,
  daiMoonbeam,
  dot,
  glmr,
  hdx,
  ibtc,
  usdt,
  wbtcAcala,
  wbtcMoonbeam,
  wethAcala,
  wethMoonbeam,
  ztg,
];

export const assetsMap = new Map<string, Asset>(assets.map((asset) => [asset.key, asset]));
