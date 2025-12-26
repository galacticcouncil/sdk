import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xc-core';

import { unq } from '../../assets';

export const unique = new Parachain({
  assetsData: [
    {
      asset: unq,
      id: 0,
      xcmLocation: {
        parents: 0,
        interior: 'Here',
      },
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
  ws: 'wss://ws.unique.network',
});
