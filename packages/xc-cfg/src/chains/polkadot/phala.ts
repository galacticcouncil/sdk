import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xc-core';

import { pha } from '../../assets';

export const phala = new Parachain({
  assetsData: [
    {
      asset: pha,
      xcmLocation: {
        parents: 0,
        interior: 'Here',
      },
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://phala.subscan.io',
  genesisHash:
    '0x1bb969d85965e4bb5a651abbedf21a54b6b31a21f66b5401cc3f1e286268d736',
  key: 'phala',
  name: 'Phala',
  parachainId: 2035,
  ss58Format: 30,
  ws: [
    'wss://api.phala.network/ws',
    'wss://phala-rpc.dwellir.com',
    'wss://rpc.helikon.io/phala',
  ],
});
