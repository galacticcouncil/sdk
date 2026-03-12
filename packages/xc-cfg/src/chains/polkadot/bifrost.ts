import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xc-core';

import {
  astr,
  bnc,
  dot,
  glmr,
  ibtc,
  usdc,
  usdt,
  vastr,
  vdot,
} from '../../assets';

const rpcWebsocketList = [
  'wss://bifrost-polkadot.ibp.network',
  'wss://eu.bifrost-polkadot-rpc.liebi.com/ws',
  //'wss://hk.p.bifrost-rpc.liebi.com/ws',
  'wss://bifrost-polkadot.dotters.network',
];

export const bifrost = new Parachain({
  assetsData: [
    {
      asset: bnc,
      id: { Native: bnc.originSymbol },
      xcmLocation: {
        parents: 0,
        interior: {
          X1: [
            {
              GeneralKey: {
                length: 2,
                data: '0x0001000000000000000000000000000000000000000000000000000000000000',
              },
            },
          ],
        },
      },
    },
    {
      asset: vdot,
      id: { VToken2: 0 },
      decimals: 10,
      min: 0.0001,
      xcmLocation: {
        parents: 0,
        interior: {
          X1: [
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
    {
      asset: vastr,
      id: { VToken2: 3 },
      decimals: 18,
      min: 0.01,
      xcmLocation: {
        parents: 0,
        interior: {
          X1: [
            {
              GeneralKey: {
                length: 2,
                data: '0x0903000000000000000000000000000000000000000000000000000000000000',
              },
            },
          ],
        },
      },
    },
    {
      asset: dot,
      id: { Token2: 0 },
      decimals: 10,
      min: 0.0001,
      xcmLocation: {
        parents: 1,
        interior: 'Here',
      },
    },
    {
      asset: usdt,
      id: { Token2: 2 },
      decimals: 6,
      min: 0.001,
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
      id: { Token2: 5 },
      decimals: 6,
      min: 0.001,
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
      asset: astr,
      id: { Token2: 3 },
      decimals: 18,
      min: 0.01,
      xcmLocation: {
        parents: 1,
        interior: {
          X1: {
            Parachain: 2006,
          },
        },
      },
    },
    {
      asset: glmr,
      id: { Token2: 1 },
      decimals: 18,
      min: 0.00001,
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
    {
      asset: ibtc,
      id: { Token2: 6 },
      decimals: 8,
      min: 0.000001,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2032,
            },
            {
              GeneralKey: {
                length: 2,
                data: '0x0001000000000000000000000000000000000000000000000000000000000000',
              },
            },
          ],
        },
      },
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://bifrost.subscan.io',
  genesisHash:
    '0x262e1b2ad728475fd6fe88e62d34c200abe6fd693931ddad144059b1eb884e5b',
  key: 'bifrost',
  name: 'Bifrost',
  parachainId: 2030,
  ss58Format: 6,
  ws: rpcWebsocketList,
});
