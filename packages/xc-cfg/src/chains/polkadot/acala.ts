import {
  ChainEcosystem as Ecosystem,
  EvmParachain,
} from '@galacticcouncil/xc-core';

import { defineChain, Chain } from 'viem';

import { aca, glmr, dai_awh, ldot, wbtc_awh, weth_awh } from '../../assets';
import { AcalaEvmResolver } from '../../resolvers';

const evmResolver = new AcalaEvmResolver();

const evmChain: Chain = defineChain({
  id: 787,
  name: 'Acala',
  network: 'acala',
  nativeCurrency: {
    decimals: 18,
    name: 'ACA',
    symbol: 'ACA',
  },
  rpcUrls: {
    public: {
      http: ['https://eth-rpc-acala.aca-api.network'],
      webSocket: ['wss://eth-rpc-acala.aca-api.network'],
    },
    default: {
      http: ['https://eth-rpc-acala.aca-api.network'],
      webSocket: ['wss://eth-rpc-acala.aca-api.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Acala Blockscout',
      url: 'https://blockscout.acala.network',
    },
  },
  testnet: false,
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
    // erc-20 assets
    {
      asset: dai_awh,
      decimals: 18,
      id: { Erc20: '0x54a37a01cd75b616d63e0ab665bffdb0143c52ae' },
      balanceId: '0x54a37a01cd75b616d63e0ab665bffdb0143c52ae',
      min: 0.01,
    },
    {
      asset: wbtc_awh,
      decimals: 8,
      id: { Erc20: '0xc80084af223c8b598536178d9361dc55bfda6818' },
      balanceId: '0xc80084af223c8b598536178d9361dc55bfda6818',
      min: 0.00000035,
    },
    {
      asset: weth_awh,
      decimals: 18,
      id: { Erc20: '0x5a4d6acdc4e3e5ab15717f407afe957f7a242578' },
      balanceId: '0x5a4d6acdc4e3e5ab15717f407afe957f7a242578',
      min: 0.000005555555555555,
    },
    // foreign assets
    {
      asset: glmr,
      decimals: 18,
      id: { ForeignAsset: 0 },
      min: 0.1,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2004,
            },
            {
              PalletInstance: 10,
            },
          ],
        },
      },
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  evmChain: evmChain,
  evmResolver: evmResolver,
  explorer: 'https://acala.subscan.io',
  genesisHash:
    '0xfc41b9bd8ef8fe53d58c7ea67c794c7ec9a73daf05e6d54b14ff6342c99ba64c',
  key: 'acala',
  name: 'Acala',
  parachainId: 2000,
  ss58Format: 10,
  wormhole: {
    id: 12,
    coreBridge: '0xa321448d90d4e5b0A732867c18eA198e75CAC48E',
    tokenBridge: '0xae9d7fe007b3327AA64A32824Aaac52C42a6E624',
  },
  ws: 'wss://acala-rpc.aca-api.network',
});
