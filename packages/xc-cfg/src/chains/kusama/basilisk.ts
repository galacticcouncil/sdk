import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xc-core';

import { bsx, ksm, usdt } from '../../assets';

export const basilisk = new Parachain({
  assetsData: [
    {
      asset: bsx,
      id: 0,
      xcmLocation: {
        parents: 0,
        interior: 'Here',
      },
    },
    {
      asset: ksm,
      decimals: 12,
      id: 1,
      xcmLocation: {
        parents: 1,
        interior: 'Here',
      },
    },
    {
      asset: usdt,
      decimals: 6,
      id: 14,
      xcmLocation: {
        parents: 1,
        interior: {
          X3: [
            {
              Parachain: 1000,
            },
            {
              PalletInstance: 50,
            },
            {
              GeneralIndex: 1984,
            },
          ],
        },
      },
    },
  ],
  ecosystem: Ecosystem.Kusama,
  explorer: 'https://basilisk.subscan.io',
  genesisHash:
    '0xa85cfb9b9fd4d622a5b28289a02347af987d8f73fa3108450e2b4a11c1ce5755',
  key: 'basilisk',
  name: 'Basilisk',
  parachainId: 2090,
  ss58Format: 10041,
  ws: 'wss://basilisk-rpc.n.dwellir.com',
});
