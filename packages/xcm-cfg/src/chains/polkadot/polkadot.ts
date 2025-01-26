import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { dot } from '../../assets';

export const polkadot = new Parachain({
  assetsData: [
    {
      asset: dot,
      xcmLocation: {
        parents: 0,
        interior: 'Here',
      },
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
  trsry: '13UVJyLnbVp9RBZYFwFGyDvVd1y27Tt8tkntv6Q7JVPhFsTB',
  ws: 'wss://polkadot-rpc.dwellir.com',
});
