import { AnyChain, Ecosystem, EvmParachain, Parachain } from '@moonbeam-network/xcm-types';
import {
  acala as defaultAcala,
  astar as defaultAstar,
  bifrostPolkadot as defaultBifrostPolkadot,
  centrifuge as defaultCentrifuge,
  hydraDX as defaultHydraDx,
  interlay as defaultInterlay,
  moonbeam as defaultMoonbeam,
  polkadot,
  polkadotAssetHub as defaultPolkadotAssetHub,
  zeitgeist as defaultZeitgeist,
} from '@moonbeam-network/xcm-config';

import {
  aca,
  astr,
  bnc,
  cfg,
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
} from './assets';

export const acala = new Parachain({
  ...defaultAcala,
  assetsData: [
    {
      asset: aca,
      id: { Token: aca.originSymbol },
      metadataId: { NativeAssetId: { Token: aca.originSymbol } },
    },
    {
      asset: daiAcala,
      balanceId: '0x54a37a01cd75b616d63e0ab665bffdb0143c52ae',
      id: { Erc20: '0x54a37a01cd75b616d63e0ab665bffdb0143c52ae' },
    },
    {
      asset: wbtcAcala,
      balanceId: '0xc80084af223c8b598536178d9361dc55bfda6818',
      id: { Erc20: '0xc80084af223c8b598536178d9361dc55bfda6818' },
    },
    {
      asset: wethAcala,
      balanceId: '0x5a4d6acdc4e3e5ab15717f407afe957f7a242578',
      id: { Erc20: '0x5a4d6acdc4e3e5ab15717f407afe957f7a242578' },
    },
  ],
});

export const assetHub = new Parachain({
  ...defaultPolkadotAssetHub,
  assetsData: [
    {
      asset: usdt,
      id: 1984,
      palletInstance: 50,
    },
  ],
  key: 'assethub',
  name: 'AssetHub',
});

export const astar = new Parachain({
  ...defaultAstar,
  assetsData: [
    {
      asset: astr,
      metadataId: 0,
    },
  ],
});

export const bifrost = new Parachain({
  ...defaultBifrostPolkadot,
  assetsData: [
    {
      asset: bnc,
      id: { Native: bnc.originSymbol },
    },
  ],
  key: 'bifrost',
});

export const centrifuge = new Parachain({
  ...defaultCentrifuge,
  assetsData: [
    {
      asset: cfg,
      id: 'Native',
    },
  ],
});

export const hydraDX = new Parachain({
  ...defaultHydraDx,
  key: 'hydradx',
  //ws: 'wss://hydradx-rpc.dwellir.com',
  assetsData: [
    {
      asset: astr,
      id: 9,
    },
    {
      asset: bnc,
      id: 14,
    },
    {
      asset: cfg,
      id: 13,
    },
    {
      asset: dot,
      id: 5,
    },
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
      asset: ibtc,
      id: 11,
    },
    {
      asset: hdx,
      id: 0,
    },
    {
      asset: usdt,
      id: 1984,
      balanceId: 10,
      metadataId: 10,
      palletInstance: 50,
    },
    {
      asset: wbtcAcala,
      id: 3,
    },
    {
      asset: wbtcMoonbeam,
      id: 19,
    },
    {
      asset: wethAcala,
      id: 4,
    },
    {
      asset: wethMoonbeam,
      id: 20,
    },
    {
      asset: ztg,
      id: 12,
    },
  ],
});

export const interlay = new Parachain({
  ...defaultInterlay,
  assetsData: [
    {
      asset: ibtc,
      decimals: 8,
      id: { Token: ibtc.originSymbol },
      metadataId: 0,
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
      asset: wbtcMoonbeam,
      id: '0xE57eBd2d67B462E9926e04a8e33f01cD0D64346D',
      metadataId: 0,
    },
    {
      asset: wethMoonbeam,
      id: '0xab3f0245B83feB11d15AAffeFD7AD465a59817eD',
      metadataId: 0,
    },
  ],
});

export const zeitgeist = new Parachain({
  ...defaultZeitgeist,
  assetsData: [
    {
      asset: ztg,
      id: 'Ztg',
    },
  ],
});

export const chains: AnyChain[] = [
  acala,
  assetHub,
  astar,
  bifrost,
  centrifuge,
  hydraDX,
  interlay,
  moonbeam,
  polkadot,
  zeitgeist,
];

export const chainsMap = new Map<string, AnyChain>(chains.map((chain) => [chain.key, chain]));
