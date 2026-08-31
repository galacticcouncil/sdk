import {
  ChainEcosystem as Ecosystem,
  NearChain,
  NearBalanceType,
} from '@galacticcouncil/xc-core';

import { near } from '../../assets';

/**
 * NEAR mainnet.
 *
 * - Standalone: carries no transfer routes, so no platform adapter is built
 * - Registered for balances, address validation and metadata only
 */
export const near_chain = new NearChain({
  key: 'near',
  name: 'NEAR',
  assetsData: [
    {
      asset: near,
      decimals: 24,
    },
  ],
  balance: NearBalanceType.Native,
  ecosystem: Ecosystem.Near,
  explorer: 'https://nearblocks.io/',
  rpc: 'https://free.rpc.fastnear.com',
});
