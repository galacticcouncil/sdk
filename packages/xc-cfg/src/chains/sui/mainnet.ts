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
  rpc: 'https://sui-rpc.publicnode.com',
  wormhole: {
    id: 21,
    coreBridge:
      '0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c',
    // Locking manager - the coin is escrowed here, minted on hydration.
    // `manager` & `transceiver.wormhole` are State object ids; `emitter`
    // is the transceiver's EmitterCap object id, which is what signs the
    // vaa (not the transceiver itself).
    ntt: {
      [sui.key]: {
        token: '0x2::sui::SUI',
        manager:
          '0xa0bc45e0384140dc125f273eda89cad1434f5dee430726cf6364bdcceba1e9a3',
        transceiver: {
          wormhole:
            '0x6afb4a6a9c4e5b6eeed568381ce95a79590f0c17ab8d0c59295826f2775bf832',
        },
        emitter:
          '0x25437da9f99dfab32c1a275663f51cd5c99eb867ab4d1f630e3799c5e68215da',
      },
    },
  },
});
