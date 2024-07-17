import {
  AnyChain,
  ChainEcosystem as Ecosystem,
  EvmChain,
  EvmParachain,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { mainnet as ethereumEvm, darwinia as darwiniaEvm } from 'viem/chains';

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
  dot,
  glmr,
  hdx,
  ibtc,
  intr,
  kar,
  ksm,
  pha,
  nodl,
  teer,
  tnkr,
  sub,
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
  pink,
  ded,
  dota,
  kilt,
  pen,
  ring,
  ldot,
} from './assets';

import { acalaEvm, hydradxEvm, moonbeamEvm } from './evm';
import { evmResolvers } from './resolver';

export const polkadot = new Parachain({
  assetsData: [
    {
      asset: dot,
    },
  ],
  ecosystem: Ecosystem.Polkadot,
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
      id: { Token: ldot.originSymbol },
      metadataId: { NativeAssetId: { Token: ldot.originSymbol } },
      decimals: 10,
    },
    {
      asset: glmr,
      id: { ForeignAsset: 0 },
      decimals: 18,
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
  defEvm: acalaEvm,
  defWormhole: {
    id: 12,
    tokenBridge: '0xae9d7fe007b3327AA64A32824Aaac52C42a6E624' as `0x${string}`,
  },
  ecosystem: Ecosystem.Polkadot,
  evmResolver: evmResolvers['acala'],
  genesisHash:
    '0xfc41b9bd8ef8fe53d58c7ea67c794c7ec9a73daf05e6d54b14ff6342c99ba64c',
  key: 'acala',
  name: 'Acala',
  parachainId: 2000,
  ss58Format: 10,
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
  defEvm: acalaEvm,
  defWormhole: {
    id: 12,
    tokenBridge: '0xae9d7fe007b3327AA64A32824Aaac52C42a6E624' as `0x${string}`,
  },
  h160AccOnly: true,
  ecosystem: Ecosystem.Polkadot,
  evmResolver: evmResolvers['acala'],
  genesisHash:
    '0xfc41b9bd8ef8fe53d58c7ea67c794c7ec9a73daf05e6d54b14ff6342c99ba64c',
  key: 'acala-evm',
  name: 'Acala EVM',
  parachainId: 2000,
  ss58Format: 10,
  ws: 'wss://acala-rpc.aca-api.network',
});

export const assetHub = new Parachain({
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
    {
      asset: dot,
      decimals: 10,
      id: 0,
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
  ],
  ecosystem: Ecosystem.Polkadot,
  genesisHash:
    '0x68d56f15f85d3136970ec16946040bc1752654e906147f7e43e9d539d7c3de2f',
  key: 'assethub',
  name: 'AssetHub',
  parachainId: 1000,
  ss58Format: 42,
  ws: 'wss://polkadot-asset-hub-rpc.polkadot.io',
});

export const astar = new Parachain({
  assetsData: [
    {
      asset: astr,
      metadataId: 0,
    },
    {
      asset: dot,
      id: '340282366920938463463374607431768211455',
      metadataId: 0,
      decimals: 10,
    },
    {
      asset: usdt,
      id: '4294969280',
      metadataId: 0,
      decimals: 6,
    },
  ],
  ecosystem: Ecosystem.Polkadot,
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
      id: { VToken2: 0 },
      metadataId: { VToken2: 0 },
      decimals: 10,
    },
    {
      asset: dot,
      id: { Token2: 0 },
      metadataId: { Token2: 0 },
      decimals: 10,
    },
    {
      asset: usdt,
      balanceId: { Token2: 2 },
      id: 1984,
      metadataId: { Token2: 2 },
      decimals: 6,
      palletInstance: 50,
    },
    {
      asset: usdc,
      id: 1337,
      balanceId: { Token2: 5 },
      metadataId: { Token2: 5 },
      decimals: 6,
      palletInstance: 50,
    },
    {
      asset: pink,
      balanceId: { Token2: 10 },
      id: 23,
      metadataId: 23,
      decimals: 10,
      palletInstance: 50,
    },
  ],
  ecosystem: Ecosystem.Polkadot,
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
  genesisHash:
    '0xb3db41421702df9a7fcac62b53ffeac85f7853cc4e689e0b93aeb3db18c09d82',
  key: 'centrifuge',
  name: 'Centrifuge',
  parachainId: 2031,
  ss58Format: 36,
  ws: 'wss://fullnode.centrifuge.io',
});

export const hydraDX = new EvmParachain({
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
      palletInstance: 10,
    },
    {
      asset: ibtc,
      id: 11,
      decimals: 8,
    },
    {
      asset: intr,
      id: 17,
      decimals: 10,
    },
    {
      asset: nodl,
      id: 26,
      decimals: 11,
    },
    {
      asset: sub,
      id: 24,
      decimals: 10,
    },
    {
      asset: unq,
      id: 25,
      decimals: 18,
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
      asset: usdc_mwh,
      id: 21,
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
      asset: usdt_mwh,
      id: 23,
      decimals: 6,
      palletInstance: 110,
    },
    {
      asset: vdot,
      id: 15,
      decimals: 10,
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
      palletInstance: 110,
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
      palletInstance: 110,
    },
    {
      asset: ztg,
      id: 12,
      decimals: 10,
    },
    {
      asset: pha,
      id: 8,
      decimals: 12,
    },
    {
      asset: cru,
      id: 27,
      decimals: 12,
    },
    {
      asset: pink,
      id: 23,
      balanceId: 1000021,
      decimals: 10,
      palletInstance: 50,
    },
    {
      asset: ded,
      id: 30,
      balanceId: 1000019,
      decimals: 10,
      palletInstance: 50,
    },
    {
      asset: dota,
      id: 18,
      balanceId: 1000038,
      decimals: 4,
      palletInstance: 50,
    },
    {
      asset: kilt,
      id: 28,
      decimals: 15,
    },
    {
      asset: pen,
      id: 1000081,
      decimals: 12,
    },
    {
      asset: ring,
      id: 31,
      decimals: 18,
    },
    {
      asset: aca,
      id: 1000099,
      decimals: 12,
    },
    {
      asset: ldot,
      id: 1000100,
      decimals: 10,
    },
  ],
  defEvm: hydradxEvm,
  ecosystem: Ecosystem.Polkadot,
  evmResolver: evmResolvers['hydradx'],
  genesisHash:
    '0xafdc188f45c71dacbaa0b62e16a91f726c7b8699a9748cdf715459de6b7f366d',
  key: 'hydradx',
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
      asset: ibtc,
      decimals: 8,
      id: { Token: ibtc.originSymbol },
      metadataId: 0,
    },
    {
      asset: intr,
      decimals: 10,
      id: { Token: intr.originSymbol },
      metadataId: 0,
    },
    {
      asset: dot,
      decimals: 10,
      id: { Token: dot.originSymbol },
      metadataId: 0,
    },
    {
      asset: usdt,
      decimals: 6,
      id: { ForeignAsset: 2 },
      metadataId: 0,
    },
    {
      asset: hdx,
      decimals: 12,
      id: { ForeignAsset: 13 },
      metadataId: 0,
    },
  ],
  ecosystem: Ecosystem.Polkadot,
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
      asset: aca,
      id: '224821240862170613278369189818311486111',
    },
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
      decimals: 12,
    },
    {
      asset: usdc_mwh,
      id: '0x931715FEE2d06333043d11F658C8CE934aC61D0c',
      metadataId: 0,
      decimals: 6,
    },
    {
      asset: usdt_mwh,
      id: '0xc30E9cA94CF52f3Bf5692aaCF81353a27052c46f',
      metadataId: 0,
      decimals: 6,
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
    {
      asset: dot,
      id: '42259045809535163221576417993425387648',
      metadataId: 0,
      decimals: 10,
    },
    {
      asset: usdt,
      id: '311091173110107856861649819128533077277',
      metadataId: 0,
      decimals: 6,
    },
    {
      asset: usdc,
      id: '0xFFfffffF7D2B0B761Af01Ca8e25242976ac0aD7D',
      metadataId: '166377000701797186346254371275954761085',
      decimals: 6,
    },
    {
      asset: pink,
      id: '64174511183114006009298114091987195453',
      decimals: 10,
    },
  ],
  defEvm: moonbeamEvm,
  defWormhole: {
    id: 16,
    tokenBridge: '0xb1731c586ca89a23809861c6103f0b96b3f57d92' as `0x${string}`,
    tokenRelayer: '0xCafd2f0A35A4459fA40C0517e17e6fA2939441CA' as `0x${string}`,
  },
  h160AccOnly: true,
  ecosystem: Ecosystem.Polkadot,
  genesisHash:
    '0xfe58ea77779b7abda7da4ec526d14db9b1e9cd40a217c34892af80a9b332b76d',
  key: 'moonbeam',
  name: 'Moonbeam',
  parachainId: 2004,
  ss58Format: 1284,
  ws: 'wss://wss.api.moonbeam.network',
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
      id: { ForeignAsset: 1 },
      decimals: 6,
    },
    {
      asset: glmr,
      id: { ForeignAsset: 3 },
      decimals: 18,
    },
  ],
  ecosystem: Ecosystem.Polkadot,
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
  defEvm: darwiniaEvm,
  h160AccOnly: true,
  ecosystem: Ecosystem.Polkadot,
  genesisHash:
    '0xf0b8924b12e8108550d28870bc03f7b45a947e1b2b9abf81bfb0b89ecb60570e',
  key: 'darwinia',
  name: 'Darwinia',
  parachainId: 2046,
  ss58Format: 18,
  ws: 'wss://darwinia-rpc.dwellir.com',
});

const polkadotChains: AnyChain[] = [
  acala,
  acala_evm,
  assetHub,
  astar,
  bifrost,
  centrifuge,
  crust,
  darwinia,
  hydraDX,
  kilt_chain,
  interlay,
  moonbeam,
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
      id: 1,
      decimals: 12,
    },
    {
      asset: usdt,
      id: 1984,
      balanceId: 14,
      metadataId: 14,
      palletInstance: 50,
      decimals: 6,
    },
    {
      asset: teer,
      id: 17,
      decimals: 12,
    },
    {
      asset: tnkr,
      id: 6,
      decimals: 12,
    },
    {
      asset: xrt,
      id: 16,
      decimals: 9,
    },
  ],
  ecosystem: Ecosystem.Kusama,
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
      id: { Token: ksm.originSymbol },
      decimals: 12,
    },
    {
      asset: bsx,
      id: { ForeignAsset: 11 },
      decimals: 12,
    },
    {
      asset: usdt,
      id: 1984,
      balanceId: { ForeignAsset: 7 },
      decimals: 6,
      palletInstance: 50,
    },
  ],
  ecosystem: Ecosystem.Kusama,
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
      id: 1984,
      decimals: 6,
      palletInstance: 50,
    },
    {
      asset: ksm,
      decimals: 12,
    },
  ],
  ecosystem: Ecosystem.Kusama,
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
  genesisHash:
    '0x631ccc82a078481584041656af292834e1ae6daab61d2875b4dd0c14bb9b17bc',
  key: 'robonomics',
  name: 'Robonomics',
  parachainId: 2048,
  ss58Format: 32,
  ws: 'wss://kusama.rpc.robonomics.network/',
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

// EVM chains config (Wormhole)

export const ethereum = new EvmChain({
  key: 'ethereum',
  name: 'Ethereum',
  assetsData: [
    {
      asset: dai,
      id: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      decimals: 18,
    },
    {
      asset: wbtc,
      id: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      decimals: 8,
    },
    {
      asset: weth,
      id: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      decimals: 18,
    },
    {
      asset: usdc,
      id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      decimals: 6,
    },
    {
      asset: usdt,
      id: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
    },
  ],
  defEvm: ethereumEvm,
  defWormhole: {
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
