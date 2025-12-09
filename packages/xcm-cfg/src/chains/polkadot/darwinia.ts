import {
  ChainEcosystem as Ecosystem,
  EvmParachain,
} from '@galacticcouncil/xcm-core';

import { darwinia as evmChain } from 'viem/chains';

import { ring } from '../../assets';

export const darwinia = new EvmParachain({
  assetsData: [
    {
      asset: ring,
      id: 'SelfReserve',
      xcmLocation: {
        parents: 0,
        interior: 'Here',
      },
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  evmChain: evmChain,
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
