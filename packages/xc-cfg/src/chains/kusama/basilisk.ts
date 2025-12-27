import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xc-core';

import { bsx, ksm, teer, tnkr, usdt, xrt } from '../../assets';

export const basilisk = new Parachain({
  assetsData: [
    {
      asset: bsx,
      id: 0,
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
    {
      asset: teer,
      decimals: 12,
      id: 17,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2015,
            },
            {
              GeneralKey: {
                length: 4,
                data: '0x5445455200000000000000000000000000000000000000000000000000000000',
              },
            },
          ],
        },
      },
    },
    {
      asset: tnkr,
      decimals: 12,
      id: 6,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2125,
            },
            {
              GeneralIndex: 0,
            },
          ],
        },
      },
    },
    {
      asset: xrt,
      decimals: 9,
      id: 16,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2119,
            },
            {
              GeneralKey: {
                length: 4,
                data: '0x42414a5500000000000000000000000000000000000000000000000000000000',
              },
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
