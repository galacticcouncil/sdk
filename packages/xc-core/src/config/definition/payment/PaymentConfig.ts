import { BaseConfig, BaseConfigParams } from '../base';

export interface PaymentConfigParams extends BaseConfigParams {
  /** Address paid. */
  to: string;
  /** Smallest unit. */
  amount: bigint;
  /** Bridge floor, smallest unit; no call is built below it. */
  min?: bigint;
}

/** A plain payment to an address a bridge derives from its order. */
export class PaymentConfig extends BaseConfig {
  readonly to: string;

  readonly amount: bigint;

  readonly min?: bigint;

  constructor({ to, amount, min, ...other }: PaymentConfigParams) {
    super(other);
    this.to = to;
    this.amount = amount;
    this.min = min;
  }
}
