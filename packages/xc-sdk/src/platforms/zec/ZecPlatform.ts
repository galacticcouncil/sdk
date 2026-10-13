import { AssetAmount, PaymentConfig, ZecChain } from '@galacticcouncil/xc-core';

import { ZecCall } from './types';
import { formatZec, toZecCall } from './utils';

import { Platform } from '../types';

/** ZIP-317 marginal fee, zatoshi per logical action. */
export const ZEC_MARGINAL_FEE = 5_000n;
/** Actions of a shielded-to-transparent payment, change included. */
export const ZEC_LOGICAL_ACTIONS = 4n;

export class ZecPlatform implements Platform<PaymentConfig> {
  constructor(_chain: ZecChain) {}

  /** One payment per config; a payment below its floor is refused. */
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

  /** Conventional fee; the wallet charges the exact one. */
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
