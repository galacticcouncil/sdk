import { Asset } from '@moonbeam-network/xcm-types';
import { dot, glmr, hdx, wbtc, weth } from '@galacticcouncil/xcm-config';

export { dot, glmr, hdx, wbtc, weth };

export const daiAcala = new Asset({
  key: 'dai-acala',
  originSymbol: 'DAI',
});

export const daiMoonbeam = new Asset({
  key: 'dai-moonbeam',
  originSymbol: 'DAI',
});

export const assets: Asset[] = [daiAcala, daiMoonbeam, dot, glmr, hdx, wbtc, weth];
