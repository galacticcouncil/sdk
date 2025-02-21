import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { ksm, usdt } from '../../assets';

export const kusamaAssetHub = new Parachain({
  assetsData: [
    {
      asset: ksm,
      decimals: 12,
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
  ],
  ecosystem: Ecosystem.Kusama,
  explorer: 'https://assethub-kusama.subscan.io',
  genesisHash:
    '0x48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a',
  key: 'assethub_kusama',
  name: 'AssetHub Kusama',
  parachainId: 1000,
  ss58Format: 2,
  treasury: 'HWZmQq6zMMk7TxixHfseFT2ewicT6UofPa68VCn3gkXrdJF',
  usesDeliveryFee: true,
  ws: 'wss://kusama-asset-hub-rpc.polkadot.io',
});
