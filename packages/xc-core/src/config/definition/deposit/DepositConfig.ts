import { BaseConfig, BaseConfigParams } from '../base';

export interface DepositConfigParams extends BaseConfigParams {
  /** Deposit address. */
  to: string;
  /** Smallest unit. */
  amount: bigint;
  /** Bridge floor, smallest unit; no call is built below it. */
  min?: bigint;
}

/**
 * A plain transfer to a deposit address.
 *
 * - The address is the bridge's, derived from its order
 * - The bridge acts once the transfer lands
 */
export class DepositConfig extends BaseConfig {
  readonly to: string;

  readonly amount: bigint;

  readonly min?: bigint;

  constructor({ to, amount, min, ...other }: DepositConfigParams) {
    super(other);
    this.to = to;
    this.amount = amount;
    this.min = min;
  }
}
