import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { glmr, usdc_mwh, ztg } from '../../assets';

export const zeitgeist = new Parachain({
  assetsData: [
    {
      asset: ztg,
      id: 'Ztg',
    },
    {
      asset: usdc_mwh,
      decimals: 6,
      id: { ForeignAsset: 1 },
      xcmLocation: {
        parents: 1,
        interior: {
          X3: [
            {
              Parachain: 2004,
            },
            {
              PalletInstance: 110,
            },
            {
              AccountKey20: {
                network: null,
                key: '0x931715fee2d06333043d11f658c8ce934ac61d0c',
              },
            },
          ],
        },
      },
    },
    {
      asset: glmr,
      decimals: 18,
      id: { ForeignAsset: 3 },
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
  explorer: 'https://zeitgeist.subscan.io',
  genesisHash:
    '0x1bf2a2ecb4a868de66ea8610f2ce7c8c43706561b6476031315f6640fe38e060',
  key: 'zeitgeist',
  name: 'Zeitgeist',
  parachainId: 2092,
  ss58Format: 73,
  usesChainDecimals: true,
  ws: 'wss://zeitgeist.api.onfinality.io/public-ws',
});
