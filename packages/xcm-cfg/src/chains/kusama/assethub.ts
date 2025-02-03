import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { ksm, usdt } from '../../assets';

export const kusamaAssetHub = new Parachain({
  assetsData: [
    {
      asset: usdt,
      decimals: 6,
      id: 1984,
      xcmLocation: {
        parents: 1,
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
      asset: ksm,
      decimals: 12,
      xcmLocation: {
        parents: 1,
        interior: 'Here',
      },
    },
  ],
  ecosystem: Ecosystem.Kusama,
  explorer: 'https://assethub-kusama.subscan.io',
  genesisHash:
    '0x48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a',
  key: 'kusama-assethub',
  name: 'AssetHub',
  parachainId: 1000,
  ss58Format: 2,
  usesDeliveryFee: true,
  ws: 'wss://kusama-asset-hub-rpc.polkadot.io',
});
