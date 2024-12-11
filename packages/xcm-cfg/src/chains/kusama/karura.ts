import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { bsx, kar, ksm, usdt } from '../../assets';

export const karura = new Parachain({
  assetsData: [
    {
      asset: kar,
      id: { Token: kar.originSymbol },
    },
    {
      asset: ksm,
      decimals: 12,
      id: { Token: ksm.originSymbol },
    },
    {
      asset: bsx,
      decimals: 12,
      id: { ForeignAsset: 11 },
    },
    {
      asset: usdt,
      balanceId: { ForeignAsset: 7 },
      decimals: 6,
      id: 1984,
      palletInstance: 50,
    },
  ],
  ecosystem: Ecosystem.Kusama,
  explorer: 'https://karura.subscan.io',
  genesisHash:
    '0xbaf5aabe40646d11f0ee8abbdc64f4a4b7674925cba08e4a05ff9ebed6e2126b',
  key: 'karura',
  name: 'Karura',
  parachainId: 2000,
  ss58Format: 8,
  ws: 'wss://karura-rpc-0.aca-api.network',
});
