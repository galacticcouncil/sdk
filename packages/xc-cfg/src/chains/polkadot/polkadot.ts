import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xc-core';

import { dot } from '../../assets';

const config = {
  assetsData: [
    {
      asset: dot,
      xcmLocation: {
        parents: 0,
        interior: 'Here',
      },
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  explorer: 'https://polkadot.subscan.io',
  genesisHash:
    '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
  name: 'Polkadot',
  parachainId: 0,
  ss58Format: 0,
  treasury: '13UVJyLnbVp9RBZYFwFGyDvVd1y27Tt8tkntv6Q7JVPhFsTB',
  usesDeliveryFee: true,
  ws: 'wss://polkadot-rpc.n.dwellir.com',
};

export const polkadot = new Parachain({
  ...config,
  key: 'polkadot',
});

export const polkadotCex = new Parachain({
  ...config,
  key: 'polkadot_cex',
  name: 'Polkadot (CEX)',
  usesCexForwarding: true,
  isTestChain: true,
});
