import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { ksm } from '../../assets';

export const kusama = new Parachain({
  assetsData: [
    {
      asset: ksm,
      xcmLocation: {
        parents: 0,
        interior: 'Here',
      },
    },
  ],
  ecosystem: Ecosystem.Kusama,
  explorer: 'https://kusama.subscan.io',
  genesisHash:
    '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe',
  key: 'kusama',
  name: 'Kusama',
  parachainId: 0,
  ss58Format: 2,
  usesDeliveryFee: true,
  ws: 'wss://kusama-rpc.dwellir.com',
});
