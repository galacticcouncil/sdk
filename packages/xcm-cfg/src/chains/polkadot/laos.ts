import {
  ChainEcosystem as Ecosystem,
  EvmParachain,
} from '@galacticcouncil/xcm-core';

import { laos as evmChain } from 'viem/chains';

import { laos } from '../../assets';

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
