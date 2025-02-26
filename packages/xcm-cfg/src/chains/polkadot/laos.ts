import {
  ChainEcosystem as Ecosystem,
  EvmParachain,
} from '@galacticcouncil/xcm-core';

import { defineChain, Chain } from 'viem';

import { laos } from '../../assets';

const evmChain: Chain = defineChain({
  id: 6283,
  name: 'Laos',
  network: 'laos',
  nativeCurrency: {
    decimals: 18,
    name: 'LAOS',
    symbol: 'LAOS',
  },
  rpcUrls: {
    public: {
      http: ['https://laos-rpc.dwellir.com'],
      webSocket: ['wss://laos-rpc.dwellir.com'],
    },
    default: {
      http: ['https://laos-rpc.dwellir.com'],
      webSocket: ['wss://laos-rpc.dwellir.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Laos Explorer',
      url: 'https://blockscout.laos.laosfoundation.io/',
    },
  },
  testnet: false,
});

export const laos_chain = new EvmParachain({
  assetsData: [
    {
      asset: laos,
      id: 'Native',
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  evmChain: evmChain,
  explorer: 'https://laos.statescan.io',
  genesisHash:
    '0xe8aecc950e82f1a375cf650fa72d07e0ad9bef7118f49b92283b63e88b1de88b',
  key: 'laos',
  name: 'Laos',
  parachainId: 3370,
  ss58Format: 18,
  usesH160Acc: true,
  ws: 'wss://laos-rpc.dwellir.com',
});
