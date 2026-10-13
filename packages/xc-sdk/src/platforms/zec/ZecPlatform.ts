import { AssetAmount, PaymentConfig, ZecChain } from '@galacticcouncil/xc-core';

import { ZecCall } from './types';
import { formatZec, toZecCall } from './utils';

import { Platform } from '../types';

/**
 * ZIP-317 conventional fee: 5,000 zatoshi per logical action, two at least.
 * A wallet spending shielded funds to a transparent address, change included,
 * runs about four; it settles the exact fee itself when it builds the
 * transaction.
 */
export const ZEC_MARGINAL_FEE = 5_000n;
export const ZEC_LOGICAL_ACTIONS = 4n;

export class ZecPlatform implements Platform<PaymentConfig> {
  constructor(_chain: ZecChain) {}

  /**
   * Build the payments of a transfer, one transaction each.
   *
   * - The amount is the config's: the builder priced the order with it
   * - A payment below its config's floor is refused: the bridge would
   *   neither deliver nor refund it
   */
  async buildCalls(
    account: string,
    _amount: bigint,
    _feeBalance: AssetAmount,
    configs: PaymentConfig[]
  ): Promise<ZecCall[]> {
    return configs.map(({ to, amount, min }) => {
      if (min !== undefined && amount < min) {
        throw new Error(
          `Payment of ${formatZec(amount)} ZEC is below the ` +
            `${formatZec(min)} ZEC minimum`
        );
      }
      return toZecCall(account, to, amount);
    });
  }

  /**
   * Fee of a transfer, in zec.
   *
   * - The conventional fee for the actions a wallet-built payment takes; the
   *   wallet charges the exact one
   */
  async estimateFee(
    _account: string,
    _amount: bigint,
    feeBalance: AssetAmount,
    configs: PaymentConfig[]
  ): Promise<AssetAmount> {
    const payments = BigInt(configs.length);
    return feeBalance.copyWith({
      amount: payments * ZEC_LOGICAL_ACTIONS * ZEC_MARGINAL_FEE,
    });
  }
}
