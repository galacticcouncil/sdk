import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm2-core';

import { bsx, kar, ksm, usdt } from '../../assets';

export const karura = new Parachain({
  assetsData: [
    {
      asset: kar,
      id: { Token: kar.originSymbol },
    },
    {
      asset: ksm,
      decimals: 12,
      id: { Token: ksm.originSymbol },
      xcmLocation: {
        parents: 1,
        interior: 'Here',
      },
    },
    {
      asset: bsx,
      decimals: 12,
      id: { ForeignAsset: 11 },
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2090,
            },
            {
              GeneralIndex: 0,
            },
          ],
        },
      },
    },
    {
      asset: usdt,
      decimals: 6,
      id: { ForeignAsset: 7 },
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
  explorer: 'https://karura.subscan.io',
  genesisHash:
    '0xbaf5aabe40646d11f0ee8abbdc64f4a4b7674925cba08e4a05ff9ebed6e2126b',
  key: 'karura',
  name: 'Karura',
  parachainId: 2000,
  ss58Format: 8,
  ws: 'wss://karura-rpc-0.aca-api.network',
});
