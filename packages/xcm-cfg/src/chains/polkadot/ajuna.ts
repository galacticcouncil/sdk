import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { ajun } from '../../assets';

export const ajuna = new Parachain({
  assetsData: [
    {
      asset: ajun,
      id: 'AJUN',
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  genesisHash:
    '0xe358eb1d11b31255a286c12e44fe6780b7edb171d657905a97e39f71d9c6c3ee',
  key: 'ajuna',
  name: 'Ajuna',
  parachainId: 2051,
  ss58Format: 1328,
  ws: 'wss://rpc-para.ajuna.network',
  explorer: 'https://ajuna.subscan.io/',
});
