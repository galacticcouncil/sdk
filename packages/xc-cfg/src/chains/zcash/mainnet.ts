import {
  ChainEcosystem as Ecosystem,
  ZecChain,
  ZecBalanceType,
} from '@galacticcouncil/xc-core';

import { zec } from '../../assets';

/**
 * Zcash mainnet.
 *
 * - Transparent addresses only — `t1` and `t3`, what NEAR Intents withdraws to
 * - The integrator registers the balance reader and the Omni client
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
