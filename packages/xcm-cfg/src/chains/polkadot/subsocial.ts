import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { sub } from '../../assets';

export const subsocial = new Parachain({
  assetsData: [
    {
      asset: sub,
      id: 0,
      xcmLocation: {
        parents: 0,
        interior: 'Here',
      },
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  genesisHash:
    '0x4a12be580bb959937a1c7a61d5cf24428ed67fa571974b4007645d1886e7c89f',
  key: 'subsocial',
  name: 'Subsocial',
  parachainId: 2101,
  ss58Format: 28,
  ws: 'wss://para.subsocial.network',
});
