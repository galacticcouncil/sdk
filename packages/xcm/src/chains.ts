import { AnyChain, EvmParachain, Parachain } from '@moonbeam-network/xcm-types';
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
  dai_awh,
  dai_mwh,
  dot,
  glmr,
  hdx,
  ibtc,
  usdc,
  usdt,
  wbtc_awh,
  wbtc_mwh,
  weth_awh,
  weth_mwh,
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
      asset: dai_awh,
      decimals: 18,
      balanceId: '0x54a37a01cd75b616d63e0ab665bffdb0143c52ae',
      id: { Erc20: '0x54a37a01cd75b616d63e0ab665bffdb0143c52ae' },
    },
    {
      asset: wbtc_awh,
      decimals: 8,
      balanceId: '0xc80084af223c8b598536178d9361dc55bfda6818',
      id: { Erc20: '0xc80084af223c8b598536178d9361dc55bfda6818' },
    },
    {
      asset: weth_awh,
      decimals: 18,
      balanceId: '0x5a4d6acdc4e3e5ab15717f407afe957f7a242578',
      id: { Erc20: '0x5a4d6acdc4e3e5ab15717f407afe957f7a242578' },
    },
  ],
});

export const assetHub = new Parachain({
  ...defaultPolkadotAssetHub,
  key: 'assethub',
  name: 'AssetHub',
  assetsData: [
    {
      asset: usdt,
      decimals: 6,
      id: 1984,
      palletInstance: 50,
    },
    {
      asset: usdc,
      decimals: 6,
      id: 1337,
      palletInstance: 50,
    },
  ],
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
  key: 'bifrost',
  assetsData: [
    {
      asset: bnc,
      id: { Native: bnc.originSymbol },
    },
  ],
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
  assetsData: [
    {
      asset: hdx,
      id: 0,
    },
    {
      asset: astr,
      id: 9,
      decimals: 18,
    },
    {
      asset: bnc,
      id: 14,
      decimals: 12,
    },
    {
      asset: cfg,
      id: 13,
      decimals: 18,
    },
    {
      asset: dot,
      id: 5,
      decimals: 10,
    },
    {
      asset: dai_awh,
      id: 2,
      decimals: 18,
    },
    {
      asset: dai_mwh,
      id: 18,
      decimals: 18,
    },
    {
      asset: glmr,
      id: 16,
      decimals: 18,
    },
    {
      asset: ibtc,
      id: 11,
      decimals: 8,
    },
    {
      asset: usdc,
      id: 1337,
      balanceId: 22,
      metadataId: 22,
      palletInstance: 50,
      decimals: 6,
    },
    {
      asset: usdt,
      id: 1984,
      balanceId: 10,
      metadataId: 10,
      palletInstance: 50,
      decimals: 6,
    },
    {
      asset: wbtc_awh,
      id: 3,
      decimals: 8,
    },
    {
      asset: wbtc_mwh,
      id: 19,
      decimals: 8,
    },
    {
      asset: weth_awh,
      id: 4,
      decimals: 18,
    },
    {
      asset: weth_mwh,
      id: 20,
      decimals: 18,
    },
    {
      asset: ztg,
      id: 12,
      decimals: 10,
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
      asset: glmr,
      id: '0x0000000000000000000000000000000000000802',
      min: 0.1,
    },
    {
      asset: dai_mwh,
      id: '0x06e605775296e851FF43b4dAa541Bb0984E9D6fD',
      metadataId: 0,
      decimals: 18,
    },
    {
      asset: hdx,
      id: '69606720909260275826784788104880799692',
      decimals: 10,
    },
    {
      asset: wbtc_mwh,
      id: '0xE57eBd2d67B462E9926e04a8e33f01cD0D64346D',
      metadataId: 0,
      decimals: 8,
    },
    {
      asset: weth_mwh,
      id: '0xab3f0245B83feB11d15AAffeFD7AD465a59817eD',
      metadataId: 0,
      decimals: 18,
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

export const chainsMap = new Map<string, AnyChain>(
  chains.map((chain) => [chain.key, chain])
);
