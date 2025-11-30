import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xc-core';

import { ewt } from '../../assets';

export const energywebx = new Parachain({
  assetsData: [
    {
      asset: ewt,
      id: 0,
      xcmLocation: {
        parents: 0,
        interior: 'Here',
      },
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://energywebx.subscan.io',
  genesisHash:
    '0x5a51e04b88a4784d205091aa7bada002f3e5da3045e5b05655ee4db2589c33b5',
  key: 'energywebx',
  name: 'Energy Web X',
  parachainId: 3345,
  ss58Format: 42,
  ws: 'wss://wnp-rpc.mainnet.energywebx.com',
});
