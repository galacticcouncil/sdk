import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { kilt } from '../../assets';

export const kilt_chain = new Parachain({
  assetsData: [
    {
      asset: kilt,
      id: 0,
      xcmLocation: {
        parents: 0,
        interior: 'Here',
      },
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://spiritnet.subscan.io',
  genesisHash:
    '0x411f057b9107718c9624d6aa4a3f23c1653898297f3d4d529d9bb6511a39dd21',
  key: 'kilt',
  name: 'Kilt',
  parachainId: 2086,
  ss58Format: 38,
  ws: 'wss://spiritnet.kilt.io',
});
