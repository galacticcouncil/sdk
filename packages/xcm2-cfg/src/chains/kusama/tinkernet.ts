import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm2-core';

import { tnkr } from '../../assets';

export const tinkernet = new Parachain({
  assetsData: [
    {
      asset: tnkr,
      id: 0,
    },
  ],
  ecosystem: Ecosystem.Kusama,
  genesisHash:
    '0xd42e9606a995dfe433dc7955dc2a70f495f350f373daa200098ae84437816ad2',
  key: 'tinkernet',
  name: 'Tinkernet',
  parachainId: 2125,
  ss58Format: 117,
  ws: 'wss://tinkernet-rpc.dwellir.com',
});
