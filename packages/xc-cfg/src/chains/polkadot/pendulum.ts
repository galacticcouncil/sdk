import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xc-core';

import { pen } from '../../assets';

export const pendulum = new Parachain({
  assetsData: [
    {
      asset: pen,
      id: 'Native',
      xcmLocation: {
        parents: 0,
        interior: 'Here',
      },
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
  usesSdkCompat: true,
  ws: 'wss://rpc-pendulum.prd.pendulumchain.tech',
});
