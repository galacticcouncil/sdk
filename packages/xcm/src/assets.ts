import { Asset } from '@moonbeam-network/xcm-types';
import { aca, astr, cfg, bnc, dot, glmr, hdx, ibtc, usdt, wbtc, weth } from '@moonbeam-network/xcm-config';

export { aca, astr, cfg, bnc, dot, glmr, hdx, ibtc, usdt, wbtc, weth };

export const daiAcala = new Asset({
  key: 'dai-acala',
  originSymbol: 'DAI',
});

export const daiMoonbeam = new Asset({
  key: 'dai-moonbeam',
  originSymbol: 'DAI',
});

export const ztg = new Asset({
  key: 'ztg',
  originSymbol: 'ZTG',
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
  wbtc,
  weth,
  ztg,
];

export const assetsMap = new Map<string, Asset>(assets.map((asset) => [asset.key, asset]));
