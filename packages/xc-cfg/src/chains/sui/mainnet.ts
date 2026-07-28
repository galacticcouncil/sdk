import {
  ChainEcosystem as Ecosystem,
  SuiChain,
  SuiBalanceType,
} from '@galacticcouncil/xc-core';

import { sui } from '../../assets';
import { suiNtt } from '../../ntt';

export const sui_chain = new SuiChain({
  id: '0x35834a8a',
  key: 'sui',
  name: 'Sui',
  assetsData: [
    {
      asset: sui,
      decimals: 9,
    },
  ],
  balance: SuiBalanceType.Native,
  ecosystem: Ecosystem.Sui,
  explorer: 'https://suiscan.xyz/',
  ntt: suiNtt,
  wormhole: {
    id: 21,
    coreBridge:
      '0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c',
  },
});
