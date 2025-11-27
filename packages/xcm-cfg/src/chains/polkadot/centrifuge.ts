import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { cfg, dot, glmr } from '../../assets';

const rpcWebsocketList = [
  'wss://rpc-centrifuge.luckyfriday.io',
  'wss://fullnode.centrifuge.io'
];

export const centrifuge = new Parachain({
  assetsData: [
    {
      asset: cfg,
      id: 'Native',
    },
    {
      asset: dot,
      id: { ForeignAsset: 5 },
      decimals: 10,
      min: 0.0001,
      xcmLocation: {
        parents: 1,
        interior: 'Here',
      },
    },
    {
      asset: glmr,
      id: { ForeignAsset: 4 },
      decimals: 18,
      min: 0.001,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2004,
            },
            {
              PalletInstance: 10,
            },
          ],
        },
      },
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://centrifuge.subscan.io',
  genesisHash:
    '0xb3db41421702df9a7fcac62b53ffeac85f7853cc4e689e0b93aeb3db18c09d82',
  key: 'centrifuge',
  name: 'Centrifuge',
  parachainId: 2031,
  ss58Format: 36,
  ws: rpcWebsocketList,
});
