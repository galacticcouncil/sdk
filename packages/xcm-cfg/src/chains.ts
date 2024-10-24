import {
  AnyChain,
  ChainEcosystem as Ecosystem,
  EvmChain,
  EvmParachain,
  Parachain,
} from '@galacticcouncil/xcm-core';

import {
  aca,
  astr,
  bnc,
  bsx,
  cfg,
  cru,
  dai,
  dai_awh,
  dai_mwh,
  ded,
  dot,
  dota,
  glmr,
  hdx,
  ibtc,
  intr,
  kar,
  kilt,
  ksm,
  ldot,
  myth,
  pen,
  pha,
  pink,
  ring,
  nodl,
  teer,
  tnkr,
  sub,
  unq,
  usdc,
  usdc_mwh,
  usdt,
  usdt_mwh,
  vastr,
  vdot,
  wbtc,
  wbtc_awh,
  wbtc_mwh,
  weth,
  weth_awh,
  weth_mwh,
  wud,
  xrt,
  ztg,
  ajun,
  eth,
} from './assets';

import {
  mainnet as evmMainetDef,
  darwinia as evmDarwiniaDef,
} from 'viem/chains';

import { evmAcalaDef, evmHydrationDef, evmMoonbeamDef } from './evm';
import { evmAcalaResolver, evmHydrationResolver } from './resolvers';

export const polkadot = new Parachain({
  assetsData: [
    {
      asset: dot,
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://polkadot.subscan.io',
  genesisHash:
    '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
  key: 'polkadot',
  name: 'Polkadot',
  parachainId: 0,
  ss58Format: 0,
  ws: 'wss://polkadot-rpc.dwellir.com',
});

export const acala = new EvmParachain({
  assetsData: [
    {
      asset: aca,
      id: { Token: aca.originSymbol },
      metadataId: { NativeAssetId: { Token: aca.originSymbol } },
    },
    {
      asset: ldot,
      decimals: 10,
      id: { Token: ldot.originSymbol },
      metadataId: { NativeAssetId: { Token: ldot.originSymbol } },
      min: 0.05,
    },
    {
      asset: glmr,
      decimals: 18,
      id: { ForeignAsset: 0 },
      min: 0.1,
    },
    {
      asset: dai_awh,
      balanceId: '0x54a37a01cd75b616d63e0ab665bffdb0143c52ae',
      decimals: 18,
      id: { Erc20: '0x54a37a01cd75b616d63e0ab665bffdb0143c52ae' },
      min: 0.01,
    },
    {
      asset: wbtc_awh,
      balanceId: '0xc80084af223c8b598536178d9361dc55bfda6818',
      decimals: 8,
      id: { Erc20: '0xc80084af223c8b598536178d9361dc55bfda6818' },
      min: 0.00000035,
    },
    {
      asset: weth_awh,
      balanceId: '0x5a4d6acdc4e3e5ab15717f407afe957f7a242578',
      decimals: 18,
      id: { Erc20: '0x5a4d6acdc4e3e5ab15717f407afe957f7a242578' },
      min: 0.000005555555555555,
    },
  ],

  ecosystem: Ecosystem.Polkadot,
  evmChain: evmAcalaDef,
  evmResolver: evmAcalaResolver,
  explorer: 'https://acala.subscan.io',
  genesisHash:
    '0xfc41b9bd8ef8fe53d58c7ea67c794c7ec9a73daf05e6d54b14ff6342c99ba64c',
  key: 'acala',
  name: 'Acala',
  parachainId: 2000,
  ss58Format: 10,
  wormhole: {
    id: 12,
    tokenBridge: '0xae9d7fe007b3327AA64A32824Aaac52C42a6E624' as `0x${string}`,
  },
  ws: 'wss://acala-rpc.aca-api.network',
});

export const acala_evm = new EvmParachain({
  assetsData: [
    {
      asset: aca,
      id: { Token: aca.originSymbol },
      metadataId: { NativeAssetId: { Token: aca.originSymbol } },
    },
    {
      asset: dai_awh,
      balanceId: '0x54a37a01cd75b616d63e0ab665bffdb0143c52ae',
      decimals: 18,
      id: { Erc20: '0x54a37a01cd75b616d63e0ab665bffdb0143c52ae' },
      min: 0.01,
    },
    {
      asset: wbtc_awh,
      balanceId: '0xc80084af223c8b598536178d9361dc55bfda6818',
      decimals: 8,
      id: { Erc20: '0xc80084af223c8b598536178d9361dc55bfda6818' },
      min: 0.00000035,
    },
    {
      asset: weth_awh,
      balanceId: '0x5a4d6acdc4e3e5ab15717f407afe957f7a242578',
      decimals: 18,
      id: { Erc20: '0x5a4d6acdc4e3e5ab15717f407afe957f7a242578' },
      min: 0.000005555555555555,
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  evmChain: evmAcalaDef,
  evmResolver: evmAcalaResolver,
  genesisHash:
    '0xfc41b9bd8ef8fe53d58c7ea67c794c7ec9a73daf05e6d54b14ff6342c99ba64c',
  key: 'acala-evm',
  name: 'Acala EVM',
  parachainId: 2000,
  ss58Format: 10,
  usesH160Acc: true,
  wormhole: {
    id: 12,
    tokenBridge: '0xae9d7fe007b3327AA64A32824Aaac52C42a6E624' as `0x${string}`,
  },
  ws: 'wss://acala-rpc.aca-api.network',
});

export const assetHub = new Parachain({
  assetsData: [
    {
      asset: dot,
      decimals: 10,
      id: 0,
    },
    {
      asset: usdt,
      decimals: 6,
      id: 1984,
      min: 0.7,
      palletInstance: 50,
    },
    {
      asset: usdc,
      decimals: 6,
      id: 1337,
      min: 0.7,
      palletInstance: 50,
    },
    {
      asset: pink,
      decimals: 10,
      id: 23,
      palletInstance: 50,
    },
    {
      asset: ded,
      decimals: 10,
      id: 30,
      palletInstance: 50,
    },
    {
      asset: dota,
      decimals: 4,
      id: 18,
      palletInstance: 50,
    },
    {
      asset: wud,
      decimals: 10,
      id: 31337,
      palletInstance: 50,
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://assethub-polkadot.subscan.io',
  genesisHash:
    '0x68d56f15f85d3136970ec16946040bc1752654e906147f7e43e9d539d7c3de2f',
  key: 'assethub',
  name: 'AssetHub',
  parachainId: 1000,
  ss58Format: 42,
  ws: [
    'wss://polkadot-asset-hub-rpc.polkadot.io',
    'wss://statemint.api.onfinality.io/public-ws',
  ],
});

export const astar = new Parachain({
  assetsData: [
    {
      asset: astr,
    },
    {
      asset: dot,
      decimals: 10,
      id: '340282366920938463463374607431768211455',
      metadataId: 0,
      min: 0.0001,
    },
    {
      asset: usdt,
      decimals: 6,
      id: '4294969280',
      metadataId: 0,
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://astar.subscan.io',
  genesisHash:
    '0x9eb76c5184c4ab8679d2d5d819fdf90b9c001403e9e17da2e14b6d8aec4029c6',
  key: 'astar',
  name: 'Astar',
  parachainId: 2006,
  ss58Format: 5,
  ws: 'wss://rpc.astar.network',
});

export const bifrost = new Parachain({
  assetsData: [
    {
      asset: bnc,
      id: { Native: bnc.originSymbol },
    },
    {
      asset: vdot,
      decimals: 10,
      id: { VToken2: 0 },
      metadataId: { VToken2: 0 },
      min: 0.0001,
    },
    {
      asset: vastr,
      decimals: 18,
      id: { VToken2: 3 },
      metadataId: { VToken2: 3 },
      min: 0.01,
    },
    {
      asset: dot,
      decimals: 10,
      id: { Token2: 0 },
      metadataId: { Token2: 0 },
      min: 0.0001,
    },
    {
      asset: usdt,
      decimals: 6,
      balanceId: { Token2: 2 },
      id: 1984,
      metadataId: { Token2: 2 },
      min: 0.001,
      palletInstance: 50,
    },
    {
      asset: usdc,
      balanceId: { Token2: 5 },
      decimals: 6,
      id: 1337,
      metadataId: { Token2: 5 },
      min: 0.001,
      palletInstance: 50,
    },
    {
      asset: pink,
      balanceId: { Token2: 10 },
      decimals: 10,
      id: 23,
      metadataId: 23,
      palletInstance: 50,
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://bifrost.subscan.io',
  genesisHash:
    '0x262e1b2ad728475fd6fe88e62d34c200abe6fd693931ddad144059b1eb884e5b',
  key: 'bifrost',
  name: 'Bifrost',
  parachainId: 2030,
  ss58Format: 6,
  ws: 'wss://bifrost-polkadot-rpc.dwellir.com',
});

export const centrifuge = new Parachain({
  assetsData: [
    {
      asset: cfg,
      id: 'Native',
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://centrifuge.subscan.io',
  genesisHash:
    '0xb3db41421702df9a7fcac62b53ffeac85f7853cc4e689e0b93aeb3db18c09d82',
  key: 'centrifuge',
  name: 'Centrifuge',
  parachainId: 2031,
  ss58Format: 36,
  ws: 'wss://fullnode.centrifuge.io',
});

export const hydration = new EvmParachain({
  assetsData: [
    {
      asset: hdx,
      id: 0,
    },
    {
      asset: aca,
      decimals: 12,
      id: 1000099,
      min: 0.090744101633,
    },
    {
      asset: astr,
      decimals: 18,
      id: 9,
      min: 0.147058823529412,
    },
    {
      asset: bnc,
      decimals: 12,
      id: 14,
      min: 0.06879518984,
    },
    {
      asset: cfg,
      decimals: 18,
      id: 13,
      min: 0.0324675324675325,
    },
    {
      asset: cru,
      decimals: 12,
      id: 27,
      min: 0.007874015748,
    },
    {
      asset: ded,
      balanceId: 1000019,
      decimals: 10,
      id: 30,
      metadataId: 1000019,
      palletInstance: 50,
    },
    {
      asset: dot,
      decimals: 10,
      id: 5,
      min: 0.001754,
    },
    {
      asset: dota,
      balanceId: 1000038,
      decimals: 4,
      id: 18,
      metadataId: 1000038,
      palletInstance: 50,
    },
    {
      asset: dai_awh,
      decimals: 18,
      id: 2,
      min: 0.01,
    },
    {
      asset: dai_mwh,
      decimals: 18,
      id: 18,
      min: 0.01,
    },
    {
      asset: glmr,
      decimals: 18,
      id: 16,
      min: 0.034854864344868,
      palletInstance: 10,
    },
    {
      asset: ibtc,
      decimals: 8,
      id: 11,
      min: 0.00000036,
    },
    {
      asset: intr,
      decimals: 10,
      id: 17,
      min: 0.6164274209,
    },
    {
      asset: kilt,
      decimals: 15,
      id: 28,
      min: 0.021358393848783,
    },
    {
      asset: ldot,
      decimals: 10,
      id: 1000100,
      min: 0.0100200401,
    },
    {
      asset: myth,
      decimals: 18,
      id: 30,
      min: 0.0213675213675214,
    },
    {
      asset: nodl,
      decimals: 11,
      id: 26,
      min: 1.0989010989,
    },
    {
      asset: pen,
      decimals: 12,
      id: 1000081,
      min: 0.153256704981,
    },
    {
      asset: pink,
      balanceId: 1000021,
      decimals: 10,
      id: 23,
      metadataId: 1000021,
      palletInstance: 50,
    },
    {
      asset: pha,
      decimals: 12,
      id: 8,
      min: 0.054945054945,
    },
    {
      asset: ring,
      decimals: 18,
      id: 31,
      min: 1,
    },
    {
      asset: sub,
      decimals: 10,
      id: 24,
      min: 0.02,
    },
    {
      asset: unq,
      decimals: 18,
      id: 25,
      min: 1.22438434893974,
    },
    {
      asset: usdc,
      balanceId: 22,
      decimals: 6,
      id: 1337,
      metadataId: 22,
      min: 0.01,
      palletInstance: 50,
    },
    {
      asset: usdc_mwh,
      decimals: 6,
      id: 21,
      min: 0.01,
    },
    {
      asset: usdt,
      balanceId: 10,
      decimals: 6,
      id: 1984,
      metadataId: 10,
      min: 0.01,
      palletInstance: 50,
    },
    {
      asset: usdt_mwh,
      decimals: 6,
      id: 23,
      min: 0.01,
      palletInstance: 110,
    },
    {
      asset: vastr,
      decimals: 18,
      id: 33,
      min: 0.133689839572193,
    },
    {
      asset: vdot,
      decimals: 10,
      id: 15,
      min: 0.0018761726,
    },
    {
      asset: wbtc,
      decimals: 8,
      id: 1000190,
      min: 0.00000023,
    },
    {
      asset: wbtc_awh,
      decimals: 8,
      id: 3,
      min: 0.00000044,
    },
    {
      asset: wbtc_mwh,
      decimals: 8,
      id: 19,
      min: 0.00000034,
      palletInstance: 110,
    },
    {
      asset: weth,
      decimals: 18,
      id: 1000189,
      min: 0.0000061,
    },
    {
      asset: weth_awh,
      decimals: 18,
      id: 4,
      min: 0.000005,
    },
    {
      asset: weth_mwh,
      decimals: 18,
      id: 20,
      min: 0.000005390835579515,
      palletInstance: 110,
    },
    {
      asset: wud,
      id: 31337,
      balanceId: 1000085,
      decimals: 10,
      palletInstance: 50,
    },
    {
      asset: ztg,
      decimals: 10,
      id: 12,
      min: 0.090744101633,
    },
    {
      asset: ajun,
      decimals: 12,
      id: 32,
      min: 0.100786131828,
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  evmChain: evmHydrationDef,
  evmResolver: evmHydrationResolver,
  explorer: 'https://hydration.subscan.io',
  genesisHash:
    '0xafdc188f45c71dacbaa0b62e16a91f726c7b8699a9748cdf715459de6b7f366d',
  key: 'hydration',
  name: 'Hydration',
  parachainId: 2034,
  ss58Format: 63,
  ws: [
    'wss://rpc.hydradx.cloud',
    'wss://hydradx-rpc.dwellir.com',
    'wss://rpc.helikon.io/hydradx',
    'wss://hydradx.paras.dotters.network',
  ],
});

export const interlay = new Parachain({
  assetsData: [
    {
      asset: intr,
      decimals: 10,
      id: { Token: intr.originSymbol },
    },
    {
      asset: ibtc,
      decimals: 8,
      id: { Token: ibtc.originSymbol },
    },
    {
      asset: dot,
      decimals: 10,
      id: { Token: dot.originSymbol },
    },
    {
      asset: usdt,
      decimals: 6,
      id: { ForeignAsset: 2 },
    },
    {
      asset: hdx,
      decimals: 12,
      id: { ForeignAsset: 13 },
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://interlay.subscan.io',
  genesisHash:
    '0xbf88efe70e9e0e916416e8bed61f2b45717f517d7f3523e33c7b001e5ffcbc72',
  key: 'interlay',
  name: 'Interlay',
  parachainId: 2032,
  ss58Format: 2032,
  ws: 'wss://api.interlay.io/parachain',
});

export const moonbeam = new EvmParachain({
  assetsData: [
    {
      asset: glmr,
      id: '0x0000000000000000000000000000000000000802',
      min: 0.1,
    },
    {
      asset: dai_mwh,
      decimals: 18,
      id: '0x06e605775296e851FF43b4dAa541Bb0984E9D6fD',
    },
    {
      asset: usdc_mwh,
      decimals: 6,
      id: '0x931715FEE2d06333043d11F658C8CE934aC61D0c',
    },
    {
      asset: usdt_mwh,
      decimals: 6,
      id: '0xc30E9cA94CF52f3Bf5692aaCF81353a27052c46f',
    },
    {
      asset: wbtc_mwh,
      decimals: 8,
      id: '0xE57eBd2d67B462E9926e04a8e33f01cD0D64346D',
    },
    {
      asset: weth_mwh,
      decimals: 18,
      id: '0xab3f0245B83feB11d15AAffeFD7AD465a59817eD',
    },
    {
      asset: usdc,
      decimals: 6,
      id: '0xFFfffffF7D2B0B761Af01Ca8e25242976ac0aD7D',
    },
    // xc-20 assets
    {
      asset: aca,
      decimals: 12,
      id: '224821240862170613278369189818311486111',
    },
    {
      asset: dot,
      decimals: 10,
      id: '42259045809535163221576417993425387648',
    },
    {
      asset: hdx,
      decimals: 12,
      id: '69606720909260275826784788104880799692',
    },
    {
      asset: pink,
      decimals: 10,
      id: '64174511183114006009298114091987195453',
    },
    {
      asset: usdt,
      decimals: 6,
      id: '311091173110107856861649819128533077277',
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  evmChain: evmMoonbeamDef,
  explorer: 'https://moonbeam.subscan.io',
  genesisHash:
    '0xfe58ea77779b7abda7da4ec526d14db9b1e9cd40a217c34892af80a9b332b76d',
  key: 'moonbeam',
  name: 'Moonbeam',
  parachainId: 2004,
  ss58Format: 1284,
  usesH160Acc: true,
  wormhole: {
    id: 16,
    tokenBridge: '0xb1731c586ca89a23809861c6103f0b96b3f57d92' as `0x${string}`,
    tokenRelayer: '0xCafd2f0A35A4459fA40C0517e17e6fA2939441CA' as `0x${string}`,
  },
  ws: 'wss://wss.api.moonbeam.network',
});

export const mythos = new Parachain({
  assetsData: [
    {
      asset: myth,
      id: 0,
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://mythos.subscan.io',
  genesisHash:
    '0xf6ee56e9c5277df5b4ce6ae9983ee88f3cbed27d31beeb98f9f84f997a1ab0b9',
  key: 'mythos',
  name: 'Mythos',
  parachainId: 3369,
  ss58Format: 29972,
  usesH160Acc: true,
  ws: 'wss://polkadot-mythos-rpc.polkadot.io',
});

export const subsocial = new Parachain({
  assetsData: [
    {
      asset: sub,
      id: 0,
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  genesisHash:
    '0x4a12be580bb959937a1c7a61d5cf24428ed67fa571974b4007645d1886e7c89f',
  key: 'subsocial',
  name: 'Subsocial',
  parachainId: 2101,
  ss58Format: 28,
  ws: 'wss://para.subsocial.network',
});

export const zeitgeist = new Parachain({
  assetsData: [
    {
      asset: ztg,
      id: 'Ztg',
    },
    {
      asset: usdc_mwh,
      decimals: 6,
      id: { ForeignAsset: 1 },
    },
    {
      asset: glmr,
      decimals: 18,
      id: { ForeignAsset: 3 },
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://zeitgeist.subscan.io',
  genesisHash:
    '0x1bf2a2ecb4a868de66ea8610f2ce7c8c43706561b6476031315f6640fe38e060',
  key: 'zeitgeist',
  name: 'Zeitgeist',
  parachainId: 2092,
  ss58Format: 73,
  usesChainDecimals: true,
  ws: [
    'wss://main.rpc.zeitgeist.pm/ws',
    'wss://zeitgeist-rpc.dwellir.com',
    'wss://zeitgeist.api.onfinality.io/public-ws',
  ],
});

export const phala = new Parachain({
  assetsData: [
    {
      asset: pha,
      metadataId: 99999999,
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://phala.subscan.io',
  genesisHash:
    '0x1bb969d85965e4bb5a651abbedf21a54b6b31a21f66b5401cc3f1e286268d736',
  key: 'phala',
  name: 'Phala',
  parachainId: 2035,
  ss58Format: 30,
  ws: 'wss://api.phala.network/ws',
});

export const nodle = new Parachain({
  assetsData: [
    {
      asset: nodl,
      id: 'NodleNative',
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://nodle.subscan.io',
  genesisHash:
    '0x97da7ede98d7bad4e36b4d734b6055425a3be036da2a332ea5a7037656427a21',
  key: 'nodle',
  name: 'Nodle',
  parachainId: 2026,
  ss58Format: 37,
  ws: 'wss://nodle-rpc.dwellir.com',
});

export const unique = new Parachain({
  assetsData: [
    {
      asset: unq,
      id: 0,
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://unique.subscan.io',
  genesisHash:
    '0x84322d9cddbf35088f1e54e9a85c967a41a56a4f43445768125e61af166c7d31',
  key: 'unique',
  name: 'Unique network',
  parachainId: 2037,
  ss58Format: 7391,
  ws: 'wss://unique-rpc.dwellir.com',
});

export const crust = new Parachain({
  assetsData: [
    {
      asset: cru,
      id: 0,
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://crust.subscan.io',
  genesisHash:
    '0x4319cc49ee79495b57a1fec4d2bd43f59052dcc690276de566c2691d6df4f7b8',
  key: 'crust',
  name: 'Crust network',
  parachainId: 2008,
  ss58Format: 88,
  ws: 'wss://crust-parachain.crustapps.net',
});

export const kilt_chain = new Parachain({
  assetsData: [
    {
      asset: kilt,
      id: 0,
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://spiritnet.subscan.io',
  genesisHash:
    '0x411f057b9107718c9624d6aa4a3f23c1653898297f3d4d529d9bb6511a39dd21',
  key: 'kilt',
  name: 'Kilt',
  parachainId: 2086,
  ss58Format: 38,
  ws: 'wss://kilt-rpc.dwellir.com',
});

export const pendulum = new Parachain({
  assetsData: [
    {
      asset: pen,
      id: 'Native',
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://pendulum.subscan.io',
  genesisHash:
    '0x5d3c298622d5634ed019bf61ea4b71655030015bde9beb0d6a24743714462c86',
  key: 'pendulum',
  name: 'Pendulum',
  parachainId: 2094,
  ss58Format: 56,
  ws: 'wss://rpc-pendulum.prd.pendulumchain.tech',
});

export const darwinia = new EvmParachain({
  assetsData: [
    {
      asset: ring,
      id: 'SelfReserve',
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  evmChain: evmDarwiniaDef,
  explorer: 'https://darwinia.subscan.io',
  genesisHash:
    '0xf0b8924b12e8108550d28870bc03f7b45a947e1b2b9abf81bfb0b89ecb60570e',
  key: 'darwinia',
  name: 'Darwinia',
  parachainId: 2046,
  ss58Format: 18,
  usesH160Acc: true,
  ws: 'wss://darwinia-rpc.dwellir.com',
});

export const ajuna = new Parachain({
  assetsData: [
    {
      asset: ajun,
      id: 'AJUN',
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  genesisHash:
    '0xe358eb1d11b31255a286c12e44fe6780b7edb171d657905a97e39f71d9c6c3ee',
  key: 'ajuna',
  name: 'Ajuna',
  parachainId: 2051,
  ss58Format: 1328,
  ws: 'wss://rpc-para.ajuna.network',
  explorer: 'https://ajuna.subscan.io/',
});

const polkadotChains: AnyChain[] = [
  acala,
  acala_evm,
  ajuna,
  assetHub,
  astar,
  bifrost,
  centrifuge,
  crust,
  darwinia,
  hydration,
  kilt_chain,
  interlay,
  moonbeam,
  mythos,
  nodle,
  phala,
  pendulum,
  polkadot,
  subsocial,
  unique,
  zeitgeist,
];

// Kusama chains configuration

export const basilisk = new Parachain({
  assetsData: [
    {
      asset: bsx,
      id: 0,
    },
    {
      asset: ksm,
      decimals: 12,
      id: 1,
    },
    {
      asset: usdt,
      balanceId: 14,
      decimals: 6,
      id: 1984,
      metadataId: 14,
      palletInstance: 50,
    },
    {
      asset: teer,
      decimals: 12,
      id: 17,
    },
    {
      asset: tnkr,
      decimals: 12,
      id: 6,
    },
    {
      asset: xrt,
      decimals: 9,
      id: 16,
    },
  ],
  ecosystem: Ecosystem.Kusama,
  explorer: 'https://basilisk.subscan.io',
  genesisHash:
    '0xa85cfb9b9fd4d622a5b28289a02347af987d8f73fa3108450e2b4a11c1ce5755',
  key: 'basilisk',
  name: 'Basilisk',
  parachainId: 2090,
  ss58Format: 10041,
  ws: 'wss://rpc.basilisk.cloud',
});

export const karura = new Parachain({
  assetsData: [
    {
      asset: kar,
      id: { Token: kar.originSymbol },
    },
    {
      asset: ksm,
      decimals: 12,
      id: { Token: ksm.originSymbol },
    },
    {
      asset: bsx,
      decimals: 12,
      id: { ForeignAsset: 11 },
    },
    {
      asset: usdt,
      balanceId: { ForeignAsset: 7 },
      decimals: 6,
      id: 1984,
      palletInstance: 50,
    },
  ],
  ecosystem: Ecosystem.Kusama,
  explorer: 'https://karura.subscan.io',
  genesisHash:
    '0xbaf5aabe40646d11f0ee8abbdc64f4a4b7674925cba08e4a05ff9ebed6e2126b',
  key: 'karura',
  name: 'Karura',
  parachainId: 2000,
  ss58Format: 8,
  ws: 'wss://karura-rpc-0.aca-api.network',
});

export const integritee = new Parachain({
  assetsData: [
    {
      asset: teer,
      id: 0,
    },
  ],
  ecosystem: Ecosystem.Kusama,
  explorer: 'https://integritee.subscan.io',
  genesisHash:
    '0xcdedc8eadbfa209d3f207bba541e57c3c58a667b05a2e1d1e86353c9000758da',
  key: 'integritee',
  name: 'Integritee',
  parachainId: 2015,
  ss58Format: 13,
  ws: 'wss://kusama.api.integritee.network',
});

export const kusama = new Parachain({
  assetsData: [
    {
      asset: ksm,
    },
  ],
  ecosystem: Ecosystem.Kusama,
  explorer: 'https://kusama.subscan.io',
  genesisHash:
    '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe',
  key: 'kusama',
  name: 'Kusama',
  parachainId: 0,
  ss58Format: 2,
  ws: 'wss://kusama-rpc.dwellir.com',
});

export const kusamaAssetHub = new Parachain({
  assetsData: [
    {
      asset: usdt,
      decimals: 6,
      id: 1984,
      palletInstance: 50,
    },
    {
      asset: ksm,
      decimals: 12,
    },
  ],
  ecosystem: Ecosystem.Kusama,
  explorer: 'https://assethub-kusama.subscan.io',
  genesisHash:
    '0x48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a',
  key: 'kusama-assethub',
  name: 'AssetHub',
  parachainId: 1000,
  ss58Format: 2,
  ws: 'wss://kusama-asset-hub-rpc.polkadot.io',
});

export const robonomics = new Parachain({
  assetsData: [
    {
      asset: xrt,
      metadataId: 0,
    },
  ],
  ecosystem: Ecosystem.Kusama,
  explorer: 'https://robonomics.subscan.io',
  genesisHash:
    '0x631ccc82a078481584041656af292834e1ae6daab61d2875b4dd0c14bb9b17bc',
  key: 'robonomics',
  name: 'Robonomics',
  parachainId: 2048,
  ss58Format: 32,
  ws: 'wss://kusama.rpc.robonomics.network',
});

export const tinkernet = new Parachain({
  assetsData: [
    {
      asset: tnkr,
      id: 0,
    },
  ],
  ecosystem: Ecosystem.Kusama,
  genesisHash:
    '0xd42e9606a995dfe433dc7955dc2a70f495f350f373daa200098ae84437816ad2',
  key: 'tinkernet',
  name: 'Tinkernet',
  parachainId: 2125,
  ss58Format: 117,
  ws: 'wss://tinkernet-rpc.dwellir.com',
});

const kusamaChains: AnyChain[] = [
  basilisk,
  integritee,
  karura,
  kusama,
  kusamaAssetHub,
  robonomics,
  tinkernet,
];

// EVM chains config

export const ethereum = new EvmChain({
  id: 1,
  key: 'ethereum',
  name: 'Ethereum',
  assetsData: [
    {
      asset: eth,
      decimals: 18,
      id: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    },
    {
      asset: weth,
      decimals: 18,
      id: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    },
    {
      asset: dai,
      decimals: 18,
      id: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    },
    {
      asset: wbtc,
      decimals: 8,
      id: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    },
    {
      asset: usdc,
      decimals: 6,
      id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    },
    {
      asset: usdt,
      decimals: 6,
      id: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    },
  ],
  ecosystem: Ecosystem.Ethereum,
  evmChain: evmMainetDef,
  wormhole: {
    id: 2,
    tokenBridge: '0x3ee18B2214AFF97000D974cf647E7C347E8fa585' as `0x${string}`,
    tokenRelayer: '0xCafd2f0A35A4459fA40C0517e17e6fA2939441CA' as `0x${string}`,
  },
});

export const evmChains: EvmChain[] = [ethereum];

export const chains: AnyChain[] = [
  ...polkadotChains,
  ...evmChains,
  ...kusamaChains,
];

export const chainsMap = new Map<string, AnyChain>(
  chains.map((chain) => [chain.key, chain])
);
