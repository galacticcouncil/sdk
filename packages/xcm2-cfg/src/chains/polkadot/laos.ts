import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm2-core';

import { laos } from '../../assets';

export const laos_chain = new Parachain({
  assetsData: [
    {
      asset: laos,
      id: 'Native',
      xcmLocation: {
        parents: 0,
        interior: 'Here',
      },
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://laos.statescan.io',
  genesisHash:
    '0xe8aecc950e82f1a375cf650fa72d07e0ad9bef7118f49b92283b63e88b1de88b',
  key: 'laos',
  name: 'Laos',
  parachainId: 3370,
  ss58Format: 42,
  usesH160Acc: true,
  ws: 'wss://rpc.laos.laosfoundation.io',
});
