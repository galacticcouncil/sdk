import {
  ChainEcosystem as Ecosystem,
  ZecChain,
  ZecBalanceType,
} from '@galacticcouncil/xc-core';

import { zec } from '../../assets';

/**
 * Zcash mainnet.
 *
 * - Standalone: carries no transfer routes, so no platform adapter is built
 * - Transparent addresses only — `t1` and `t3`, what NEAR Intents withdraws to
 * - No `balanceReader`: Zcash is UTXO and has no canonical public balance API,
 *   so balances stay unavailable until an indexer is supplied
 */
export const zcash = new ZecChain({
  key: 'zec',
  name: 'Zcash',
  assetsData: [
    {
      asset: zec,
      decimals: 8,
    },
  ],
  balance: ZecBalanceType.Transparent,
  ecosystem: Ecosystem.Zcash,
  explorer: 'https://mainnet.zcashexplorer.app/',
});
