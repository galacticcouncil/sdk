import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { myth } from '../../assets';

export const mythos = new Parachain({
  assetsData: [
    {
      asset: myth,
      id: 0,
      xcmLocation: {
        parents: 0,
        interior: 'Here',
      },
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://mythos.subscan.io',
  genesisHash:
    '0xf6ee56e9c5277df5b4ce6ae9983ee88f3cbed27d31beeb98f9f84f997a1ab0b9',
  key: 'mythos',
  name: 'Mythos',
  parachainId: 3369,
  ss58Format: 29972,
  usesH160Acc: true,
  ws: 'wss://polkadot-mythos-rpc.polkadot.io',
});
