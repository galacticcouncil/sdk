import { Asset } from '@moonbeam-network/xcm-types';
import { astr, cfg, bnc, dot, glmr, hdx, ibtc, usdt, wbtc, weth } from '@moonbeam-network/xcm-config';

export { astr, cfg, bnc, dot, glmr, hdx, ibtc, usdt, wbtc, weth };

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

export const assets: Asset[] = [astr, cfg, bnc, daiAcala, daiMoonbeam, dot, glmr, hdx, ibtc, usdt, wbtc, weth, ztg];

export const assetsMap = new Map<string, Asset>(
  assets.map((asset) => [asset.key, asset]),
);