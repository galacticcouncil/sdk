import { BaseConfig, BaseConfigParams } from '../base';

export interface PaymentConfigParams extends BaseConfigParams {
  /** Address paid on the source chain. */
  to: string;
  /** Paid amount, in the asset's smallest unit. */
  amount: bigint;
  /** Smallest payable amount, in the asset's smallest unit. */
  min?: bigint;
}

/**
 * A plain payment to an address on a utxo chain.
 *
 * - The address itself carries the delivery: a bridge derives it from an
 *   order it holds, so the payment needs no data of its own
 * - One payment is one transaction, nothing batches
 * - `type` names the platform signing it, the source chain's own
 * - `min` is the bridge's floor: a payment below it is lost, so no call is
 *   built for one
 */
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
