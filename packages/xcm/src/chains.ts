import { AnyChain, EvmParachain, Parachain } from '@moonbeam-network/xcm-types';
import {
  polkadot,
  hydraDX as defaultHydraDx,
  moonbeam as defaultMoonbeam,
  acala as defaultAcala,
} from '@galacticcouncil/xcm-config';

import { daiAcala, daiMoonbeam, glmr, hdx, wbtc, weth } from './assets';

export const acala = new Parachain({
  ...defaultAcala,
  assetsData: [
    {
      asset: daiAcala,
      id: { Erc20: '0x54a37a01cd75b616d63e0ab665bffdb0143c52ae' },
      balanceId: '0x54a37a01cd75b616d63e0ab665bffdb0143c52ae',
    },
  ],
});

export const hydraDX = new Parachain({
  ...defaultHydraDx,
  key: 'hydradx',
  ws: 'wss://hydradx-rpc.dwellir.com',
  assetsData: [
    {
      asset: daiAcala,
      id: 2,
    },
    {
      asset: daiMoonbeam,
      id: 18,
    },
    {
      asset: glmr,
      id: 16,
    },
    {
      asset: hdx,
      id: 0,
    },
    {
      asset: wbtc,
      id: 19,
    },
    {
      asset: weth,
      id: 20,
    },
  ],
});

export const moonbeam = new EvmParachain({
  ...defaultMoonbeam,
  assetsData: [
    {
      asset: daiMoonbeam,
      id: '0x06e605775296e851FF43b4dAa541Bb0984E9D6fD',
      metadataId: 0,
    },
    {
      asset: glmr,
      id: '0x0000000000000000000000000000000000000802',
      min: 0.1,
    },
    {
      asset: hdx,
      id: '69606720909260275826784788104880799692',
    },
    {
      asset: wbtc,
      id: '0xE57eBd2d67B462E9926e04a8e33f01cD0D64346D',
      metadataId: 0,
    },
    {
      asset: weth,
      id: '0xab3f0245B83feB11d15AAffeFD7AD465a59817eD',
      metadataId: 0,
    },
  ],
});

export const chains: AnyChain[] = [polkadot, hydraDX, moonbeam, acala];
