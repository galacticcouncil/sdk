import { BaseConfig, BaseConfigParams, CallType } from '../base';

export interface FunctionCallConfigParams extends Omit<
  BaseConfigParams,
  'type'
> {
  /** Contract account the call is sent to. */
  receiverId: string;
  /** Json arguments of {@link BaseConfig.func}. */
  args: Record<string, unknown>;
  /** Prepaid gas - whatever is left unused is refunded. */
  gas: bigint;
  /** Attached deposit, yocto. */
  deposit?: bigint;
  /** Wrap native near into {@link receiverId} before spending it */
  wrapNative?: boolean;
}

/**
 * A NEAR function call.
 *
 * - Consecutive calls on the same receiver go out as one transaction
 */
export class FunctionCallConfig extends BaseConfig {
  readonly receiverId: string;

  readonly args: Record<string, unknown>;

  readonly gas: bigint;

  readonly deposit: bigint;

  readonly wrapNative?: boolean;

  constructor({
    receiverId,
    args,
    gas,
    deposit,
    wrapNative,
    ...other
  }: FunctionCallConfigParams) {
    super({ ...other, type: CallType.Near });
    this.receiverId = receiverId;
    this.args = args;
    this.gas = gas;
    this.deposit = deposit ?? 0n;
    this.wrapNative = wrapNative;
  }
}
