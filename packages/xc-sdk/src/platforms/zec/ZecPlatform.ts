import { AssetAmount, DepositConfig, ZecChain } from '@galacticcouncil/xc-core';

import { ZecCall } from './types';
import {
  formatZec,
  toZecCall,
  ZEC_LOGICAL_ACTIONS,
  ZEC_MARGINAL_FEE,
} from './utils';

import { Platform } from '../types';

export class ZecPlatform implements Platform<DepositConfig> {
  constructor(_chain: ZecChain) {}

  /** One transfer per config; a deposit below its floor is refused. */
  async buildCalls(
    account: string,
    _amount: bigint,
    _feeBalance: AssetAmount,
    configs: DepositConfig[]
  ): Promise<ZecCall[]> {
    return configs.map(({ to, amount, min }) => {
      if (min !== undefined && amount < min) {
        throw new Error(
          `Deposit of ${formatZec(amount)} ZEC is below the ` +
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
    configs: DepositConfig[]
  ): Promise<AssetAmount> {
    const transfers = BigInt(configs.length);
    return feeBalance.copyWith({
      amount: transfers * ZEC_LOGICAL_ACTIONS * ZEC_MARGINAL_FEE,
    });
  }
}
