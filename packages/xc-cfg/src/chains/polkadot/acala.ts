import {
  ChainEcosystem as Ecosystem,
  EvmParachain,
} from '@galacticcouncil/xc-core';

import { defineChain, Chain } from 'viem';

import { aca, glmr, ldot } from '../../assets';
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
      xcmLocation: {
        parents: 0,
        interior: {
          X1: [
            {
              GeneralKey: {
                length: 2,
                data: '0x0000000000000000000000000000000000000000000000000000000000000000',
              },
            },
          ],
        },
      },
    },
    {
      asset: ldot,
      decimals: 10,
      id: { Token: ldot.originSymbol },
      metadataId: { NativeAssetId: { Token: ldot.originSymbol } },
      min: 0.05,
      xcmLocation: {
        parents: 0,
        interior: {
          X1: [
            {
              GeneralKey: {
                length: 2,
                data: '0x0003000000000000000000000000000000000000000000000000000000000000',
              },
            },
          ],
        },
      },
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
  ws: 'wss://acala-rpc.n.dwellir.com',
});
