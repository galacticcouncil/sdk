import {
  ChainEcosystem as Ecosystem,
  SuiChain,
  SuiBalanceType,
} from '@galacticcouncil/xc-core';

import { sui } from '../../assets';

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
  wormhole: {
    id: 21,
    coreBridge:
      '0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c',
    // Locking managers - the coin is escrowed here, minted on hydration.
    // `token` is the coin type (0x2::sui::SUI for native), `manager` &
    // `transceiver.wormhole` the State object ids and `emitter` the
    // transceiver's EmitterCap object id, which is what signs the vaa.
    ntt: {},
  },
});
