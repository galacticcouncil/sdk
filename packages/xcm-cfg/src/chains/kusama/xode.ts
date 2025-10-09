import {
  ChainEcosystem as Ecosystem,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { xon } from '../../assets';

export const xode = new Parachain({
  assetsData: [
    {
      asset: xon,
      id: 0,
    },
  ],
  ecosystem: Ecosystem.Kusama,
  genesisHash:
    '0x28cc1df52619f4edd9f0389a7e910a636276075ecc429600f1dd434e281a04e9',
  key: 'xode',
  name: 'Xode',
  parachainId: 3344,
  ss58Format: 42,
  ws: 'rpcnodea01.xode.net/Fn7yoxCmcIrCF6VziCcDmYTwL8R03a/rpc',
});
