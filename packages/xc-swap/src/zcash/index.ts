import { createOmniClient } from '../omni';

import { buildDeposit } from './deposit';
import { buildWithdrawal } from './withdrawal';
import type { ZcashTransfers, ZcashTransfersOpts } from './types';

export type {
  OneClickDeposit,
  ZcashPair,
  ZcashTransfer,
  ZcashTransferArgs,
  ZcashTransfers,
  ZcashTransfersOpts,
} from './types';

/**
 * Zcash transfers of Hydration ZEC, in the shape the cross-chain form drives.
 *
 * - Out through 1Click, in through Omni, both over the NEAR ntt manager
 * - Kept out of the route config: both bridges only hand out deposit
 *   addresses, the ntt leg is the configured Hydration ↔ NEAR route
 *
 * @param opts - wallet, 1Click refund account and Omni client
 */
export function createZcashTransfers(opts: ZcashTransfersOpts): ZcashTransfers {
  const { wallet, refundTo } = opts;
  const config = wallet.config;

  if (!config.getChain('near').isValidAddress(refundTo)) {
    throw new Error('1Click refunds to a NEAR account only: ' + refundTo);
  }

  const ctx = { wallet, refundTo, omni: opts.omni ?? createOmniClient() };
  const hydration = config.getChain('hydration');
  const zcash = config.getChain('zec');
  const zec = config.getAsset('zec');

  return {
    pairs: [
      {
        source: { chain: hydration, asset: zec },
        destination: { chain: zcash, asset: zec },
      },
      {
        source: { chain: zcash, asset: zec },
        destination: { chain: hydration, asset: zec },
      },
    ],
    withdraw: (args) => buildWithdrawal(ctx, args),
    deposit: (args) => buildDeposit(ctx, args),
  };
}
