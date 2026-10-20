import {
  ChainEcosystem as Ecosystem,
  NearChain,
  NearBalanceType,
  NttTokenDef,
} from '@galacticcouncil/xc-core';

import { near, wnear, zec } from '../../assets';

/**
 * whm near-ntt, LOCKING `wrap.near`.
 *
 * - Manager & wormhole transceiver are one contract
 * - Emits as the sha256 of its account, which wormholescan reports in hex
 * - Peered with the hydration burning manager of asset 1001358
 */
const WNEAR_NTT: NttTokenDef = {
  token: 'wrap.near',
  manager: 'ntt-near.hydration-whm.near',
  transceiver: {
    wormhole: 'ntt-near.hydration-whm.near',
  },
  emitter: '0xd473056b88c2062503ea1425bdea8e87609e3d499b3b4d1809e440df2d7cb9e3',
};

/**
 * whm near-ntt, LOCKING `zec.omft.near` - Omni's bridged ZEC.
 *
 * - Same contract code as the wNEAR deployment, one account per token
 * - Peered with the hydration burning manager of asset 1001357
 */
const ZEC_NTT: NttTokenDef = {
  token: 'zec.omft.near',
  manager: 'ntt-zec.hydration-whm.near',
  transceiver: {
    wormhole: 'ntt-zec.hydration-whm.near',
  },
  emitter: '0xca4092420316d55cfbb9a479ca23fdf0f5a0864a80c755b46e071c834fbf3976',
};

/**
 * NEAR mainnet.
 *
 * - Routes wNEAR, native NEAR and ZEC to hydration over ntt
 * - Self-redeem only: no executor serves NEAR
 * - Receives from hydration as `wrap.near` and `zec.omft.near`, claimed
 *   with `complete`
 */
export const near_chain = new NearChain({
  key: 'near',
  name: 'NEAR',
  assetsData: [
    {
      asset: near,
      decimals: 24,
    },
    {
      asset: wnear,
      id: 'wrap.near',
      decimals: 24,
    },
    {
      asset: zec,
      id: 'zec.omft.near',
      decimals: 8,
    },
  ],
  balance: NearBalanceType.Ft,
  balanceOverrides: {
    [near.key]: NearBalanceType.Native,
  },
  ecosystem: Ecosystem.Near,
  explorer: 'https://nearblocks.io/',
  rpc: 'https://free.rpc.fastnear.com',
  wormhole: {
    id: 15,
    coreBridge: 'contract.wormhole_crypto.near',
    ntt: {
      [near.key]: WNEAR_NTT,
      [wnear.key]: WNEAR_NTT,
      [zec.key]: ZEC_NTT,
    },
    platformAddressFormat: 'sha256',
  },
});
