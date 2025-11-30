import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xc-core';

import { xrt } from '../../assets';

export const robonomics = new Parachain({
  assetsData: [
    {
      asset: xrt,
      xcmLocation: {
        parents: 0,
        interior: 'Here',
      },
    },
  ],
  ecosystem: Ecosystem.Kusama,
  explorer: 'https://robonomics.subscan.io',
  genesisHash:
    '0x631ccc82a078481584041656af292834e1ae6daab61d2875b4dd0c14bb9b17bc',
  key: 'robonomics',
  name: 'Robonomics',
  parachainId: 2048,
  ss58Format: 32,
  ws: 'wss://kusama.rpc.robonomics.network',
});
