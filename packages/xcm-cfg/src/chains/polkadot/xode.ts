import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { xon } from '../../assets';

export const xode = new Parachain({
  assetsData: [
    {
      asset: xon,
      xcmLocation: {
        parents: 0,
        interior: 'Here',
      },
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://node.xode.net/',
  genesisHash:
    '0xb2985e778bb748c70e450dcc084cc7da79fe742cc23d3b040abd7028187de69c',
  key: 'xode',
  name: 'Xode',
  parachainId: 3417,
  ss58Format: 280,
  ws: [
    'wss://polkadot-rpcnode.xode.net',
    'wss://xode-polkadot-rpc-01.zeeve.net/y0yxg038wn1fncc/rpc'
  ],
});
