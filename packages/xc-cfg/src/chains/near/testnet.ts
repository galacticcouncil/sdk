import {
  ChainEcosystem as Ecosystem,
  NearChain,
  NearBalanceType,
  NttTokenDef,
} from '@galacticcouncil/xc-core';

import { near, wnear } from '../../assets';

/**
 * whm near-ntt, LOCKING wrap.testnet.
 *
 * - Manager & wormhole transceiver are one contract
 * - Emits as the sha256 of its account, which wormholescan reports in hex
 */
const WNEAR_NTT: NttTokenDef = {
  token: 'wrap.testnet',
  manager: 'ntt-near.whm-ntt-0bugdc.testnet',
  transceiver: {
    wormhole: 'ntt-near.whm-ntt-0bugdc.testnet',
  },
  emitter: '0x34831e4dba0ea821cb7f0af0ce96f5efe4beb0db1fded12219e4329ff95a7213',
};

/**
 * NEAR testnet.
 *
 * - Test chain: kept out of the ui, its routes are registered on demand
 *   (see `testnet.registerNear`)
 */
export const near_testnet = new NearChain({
  key: 'near_testnet',
  name: 'NEAR Testnet',
  assetsData: [
    {
      asset: near,
      decimals: 24,
    },
    {
      asset: wnear,
      id: 'wrap.testnet',
      decimals: 24,
    },
  ],
  balance: NearBalanceType.Ft,
  balanceOverrides: {
    [near.key]: NearBalanceType.Native,
  },
  ecosystem: Ecosystem.Near,
  explorer: 'https://testnet.nearblocks.io/',
  isTestChain: true,
  rpc: 'https://test.rpc.fastnear.com',
  wormhole: {
    id: 15,
    coreBridge: 'wormhole.wormhole.testnet',
    // One deployment, keyed twice - native near is wrapped into the token it
    // locks, so both source assets resolve to it.
    ntt: {
      [wnear.key]: WNEAR_NTT,
      [near.key]: WNEAR_NTT,
    },
    platformAddressFormat: 'sha256',
  },
});
