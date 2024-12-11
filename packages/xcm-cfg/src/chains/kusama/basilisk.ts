import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { bsx, ksm, teer, tnkr, usdt, xrt } from '../../assets';

export const basilisk = new Parachain({
  assetsData: [
    {
      asset: bsx,
      id: 0,
    },
    {
      asset: ksm,
      decimals: 12,
      id: 1,
    },
    {
      asset: usdt,
      balanceId: 14,
      decimals: 6,
      id: 1984,
      metadataId: 14,
      palletInstance: 50,
    },
    {
      asset: teer,
      decimals: 12,
      id: 17,
    },
    {
      asset: tnkr,
      decimals: 12,
      id: 6,
    },
    {
      asset: xrt,
      decimals: 9,
      id: 16,
    },
  ],
  ecosystem: Ecosystem.Kusama,
  explorer: 'https://basilisk.subscan.io',
  genesisHash:
    '0xa85cfb9b9fd4d622a5b28289a02347af987d8f73fa3108450e2b4a11c1ce5755',
  key: 'basilisk',
  name: 'Basilisk',
  parachainId: 2090,
  ss58Format: 10041,
  ws: 'wss://rpc.basilisk.cloud',
});
