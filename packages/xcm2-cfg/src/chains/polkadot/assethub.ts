import {
  ChainEcosystem as Ecosystem,
  Parachain,
  ParachainParams,
} from '@galacticcouncil/xcm2-core';

import { ded, dot, dota, ksm, myth, pink, usdc, usdt, wud } from '../../assets';

const config = {
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
      min: 0.00000003,
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
    {
      asset: ksm,
      decimals: 12,
      min: 0.0001,
      xcmLocation: {
        parents: 2,
        interior: {
          X1: [
            {
              GlobalConsensus: 'Kusama',
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
  name: 'AssetHub',
  parachainId: 1000,
  ss58Format: 0,
  treasury: '14xmwinmCEz6oRrFdczHKqHgWNMiCysE2KrA4jXXAAM1Eogk',
  usesDeliveryFee: true,
  ws: [
    'wss://polkadot-asset-hub-rpc.polkadot.io',
    'wss://asset-hub-polkadot-rpc.dwellir.com',
  ],
} as Omit<ParachainParams, 'key'>;

export const assetHub = new Parachain({
  ...config,
  key: 'assethub',
  name: 'AssetHub Polkadot',
});

export const assetHubCex = new Parachain({
  ...config,
  key: 'assethub_cex',
  name: 'AssetHub (CEX)',
  usesCexForwarding: true,
  usesSignerFee: true,
  isTestChain: true,
});
