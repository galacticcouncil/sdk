import { type Abi as TAbi, encodeFunctionData } from 'viem';

import { BaseConfig, BaseConfigParams, CallType } from '../base';
import { ExtrinsicConfig } from '../extrinsic';

export interface ContractConfigParams extends Omit<BaseConfigParams, 'type'> {
  abi: TAbi;
  args: any[];
  address: string;
  /** ERC20 token to spend (allowance target), if not derivable from args */
  token?: string;
  /** Wrap native gas into {@link token} before spending it */
  wrapNative?: boolean;
  value?: bigint;
  /**
   * Substrate extrinsic to batch ahead of the call.
   *
   * Only reachable from an ss58 origin, where the call is already wrapped in
   * `EVM.call` and can share a `Utility.batch_all` with a native extrinsic.
   * An h160 origin signs a plain evm transaction with nothing to batch into,
   * so a config carrying this must not be relied on to fund itself there.
   */
  prior?: ExtrinsicConfig;
  /**
   * Contract call to run straight after this one, sharing its origin.
   *
   * For a call whose effect only counts once a second contract has been told
   * about it - an ntt transfer is emitted by the manager, then paid for at the
   * Executor. Kept as a follow-up rather than folded into one call because no
   * deployed contract does both without an unbounded `approve`.
   */
  follow?: ContractConfig;
}

export class ContractConfig extends BaseConfig {
  readonly abi: TAbi;

  readonly address: string;

  readonly args: any[];

  readonly token?: string;

  readonly wrapNative?: boolean;

  readonly value?: bigint;

  readonly prior?: ExtrinsicConfig;

  readonly follow?: ContractConfig;

  constructor({
    abi,
    address,
    args,
    token,
    wrapNative,
    value,
    prior,
    follow,
    ...other
  }: ContractConfigParams) {
    super({ ...other, type: CallType.Evm });
    this.abi = abi;
    this.address = address;
    this.args = args;
    this.token = token;
    this.wrapNative = wrapNative;
    this.value = value;
    this.prior = prior;
    this.follow = follow;
  }

  encodeFunctionData() {
    return encodeFunctionData({
      abi: this.abi,
      functionName: this.func,
      args: this.args,
    });
  }
}
