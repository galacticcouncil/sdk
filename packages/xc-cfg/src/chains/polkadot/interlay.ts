import {
  ChainEcosystem as Ecosystem,
  Parachain,
  XcmVersion,
} from '@galacticcouncil/xc-core';

import { dot, hdx, ibtc, intr, usdc, usdt, vdot } from '../../assets';

export const interlay = new Parachain({
  assetsData: [
    {
      asset: intr,
      decimals: 10,
      id: { Token: intr.originSymbol },
      xcmLocation: {
        parents: 0,
        interior: {
          X1: {
            GeneralKey: {
              length: 2,
              data: '0x0002000000000000000000000000000000000000000000000000000000000000',
            },
          },
        },
      },
    },
    {
      asset: ibtc,
      decimals: 8,
      id: { Token: ibtc.originSymbol },
      xcmLocation: {
        parents: 0,
        interior: {
          X1: {
            GeneralKey: {
              length: 2,
              data: '0x0001000000000000000000000000000000000000000000000000000000000000',
            },
          },
        },
      },
    },
    {
      asset: dot,
      decimals: 10,
      id: { Token: dot.originSymbol },
      xcmLocation: {
        parents: 1,
        interior: 'Here',
      },
    },
    {
      asset: usdt,
      decimals: 6,
      id: { ForeignAsset: 2 },
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
      asset: usdc,
      decimals: 6,
      id: { ForeignAsset: 12 },
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
              GeneralIndex: 1337,
            },
          ],
        },
      },
    },
    {
      asset: hdx,
      decimals: 12,
      id: { ForeignAsset: 13 },
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2034,
            },
            {
              GeneralIndex: 0,
            },
          ],
        },
      },
    },
    {
      asset: vdot,
      decimals: 10,
      id: { ForeignAsset: 3 },
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2030,
            },
            {
              GeneralKey: {
                length: 2,
                data: '0x0900000000000000000000000000000000000000000000000000000000000000',
              },
            },
          ],
        },
      },
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://interlay.subscan.io',
  genesisHash:
    '0xbf88efe70e9e0e916416e8bed61f2b45717f517d7f3523e33c7b001e5ffcbc72',
  key: 'interlay',
  name: 'Interlay',
  parachainId: 2032,
  ss58Format: 2032,
  ws: 'wss://api.interlay.io/parachain',
  usesLegacyEnhancer: true,
  xcmVersion: XcmVersion.v3,
});
