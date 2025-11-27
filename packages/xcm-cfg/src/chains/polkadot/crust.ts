import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { cru } from '../../assets';

export const crust = new Parachain({
  assetsData: [
    {
      asset: cru,
      id: 0,
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://crust.subscan.io',
  genesisHash:
    '0x4319cc49ee79495b57a1fec4d2bd43f59052dcc690276de566c2691d6df4f7b8',
  key: 'crust',
  name: 'Crust network',
  parachainId: 2008,
  ss58Format: 88,
  ws: [
    'wss://crust-parachain.crustnetwork.app',
    'wss://crust-parachain.crustapps.net',
  ],
});
