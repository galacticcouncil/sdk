import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { ded, dot, dota, myth, pink, usdc, usdt, wud } from '../../assets';

export const assethub = new Parachain({
  assetsData: [
    {
      asset: dot,
      decimals: 10,
      id: 0,
      xcmLocation: {
        parents: 1,
        interior: 'Here',
      },
    },
    {
      asset: usdt,
      decimals: 6,
      id: 1984,
      min: 0.7,
      xcmLocation: {
        parents: 0,
        interior: {
          X2: [
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
      id: 1337,
      min: 0.7,
      xcmLocation: {
        parents: 0,
        interior: {
          X2: [
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
      asset: pink,
      decimals: 10,
      id: 23,
      xcmLocation: {
        parents: 0,
        interior: {
          X2: [
            {
              PalletInstance: 50,
            },
            {
              GeneralIndex: 23,
            },
          ],
        },
      },
    },
    {
      asset: ded,
      decimals: 10,
      id: 30,
      xcmLocation: {
        parents: 0,
        interior: {
          X2: [
            {
              PalletInstance: 50,
            },
            {
              GeneralIndex: 30,
            },
          ],
        },
      },
    },
    {
      asset: dota,
      decimals: 4,
      id: 18,
      xcmLocation: {
        parents: 0,
        interior: {
          X2: [
            {
              PalletInstance: 50,
            },
            {
              GeneralIndex: 18,
            },
          ],
        },
      },
    },
    {
      asset: wud,
      decimals: 10,
      id: 31337,
      xcmLocation: {
        parents: 0,
        interior: {
          X2: [
            {
              PalletInstance: 50,
            },
            {
              GeneralIndex: 31337,
            },
          ],
        },
      },
    },
    // foreign assets
    {
      asset: myth,
      decimals: 18,
      xcmLocation: {
        parents: 1,
        interior: {
          X1: [
            {
              Parachain: 3369,
            },
          ],
        },
      },
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://assethub-polkadot.subscan.io',
  genesisHash:
    '0x68d56f15f85d3136970ec16946040bc1752654e906147f7e43e9d539d7c3de2f',
  key: 'assethub',
  name: 'AssetHub',
  parachainId: 1000,
  ss58Format: 42,
  ws: [
    'wss://polkadot-asset-hub-rpc.polkadot.io',
    'wss://statemint.api.onfinality.io/public-ws',
  ],
});
