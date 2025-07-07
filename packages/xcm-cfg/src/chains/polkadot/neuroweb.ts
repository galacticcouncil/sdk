import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm-core';

import {
  neuro
} from '../../assets';

export const neuroweb = new Parachain({
  assetsData: [
    {
      asset: neuro,
      xcmLocation: {
        parents: 0,
        interior: 'Here',
      },
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://neuroweb.subscan.io',
  genesisHash:
    '0xe7e0962324a3b86c83404dbea483f25fb5dab4c224791c81b756cfc948006174',
  key: 'neuroweb',
  name: 'Neuroweb',
  parachainId: 2043,
  ss58Format: 101,
  ws: 'wss://parachain-rpc.origin-trail.network',
});
