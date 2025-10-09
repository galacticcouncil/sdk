import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { eurc, pen, xlm } from '../../assets';

export const pendulum = new Parachain({
  assetsData: [
    {
      asset: pen,
      id: 'Native',
    },
    {
      asset: eurc,
      id: {
        Stellar: {
          AlphaNum4: {
            code: '0x45555243',
            issuer:
              '0xcf4f5a26e2090bb3adcf02c7a9d73dbfe6659cc690461475b86437fa49c71136',
          },
        },
      },
      decimals: 12,
      xcmLocation: {
        parents: 1,
        interior: {
          X5: [
            {
              Parachain: 2094,
            },
            {
              PalletInstance: 53,
            },
            {
              GeneralIndex: 2,
            },
            {
              GeneralKey: {
                length: 4,
                data: '0x4555524300000000000000000000000000000000000000000000000000000000',
              },
            },
            {
              GeneralKey: {
                length: 32,
                data: '0xcf4f5a26e2090bb3adcf02c7a9d73dbfe6659cc690461475b86437fa49c71136',
              },
            },
          ],
        },
      },
    },
    {
      asset: xlm,
      id: {
        Stellar: 'StellarNative',
      },
      decimals: 12,
      xcmLocation: {
        parents: 1,
        interior: {
          X3: [
            {
              Parachain: 2094,
            },
            {
              PalletInstance: 53,
            },
            {
              GeneralIndex: 2,
            },
          ],
        },
      },
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://pendulum.subscan.io',
  genesisHash:
    '0x5d3c298622d5634ed019bf61ea4b71655030015bde9beb0d6a24743714462c86',
  key: 'pendulum',
  name: 'Pendulum',
  parachainId: 2094,
  ss58Format: 56,
  ws: 'wss://rpc-pendulum.prd.pendulumchain.tech',
});
