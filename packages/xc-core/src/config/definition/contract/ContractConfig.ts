import { type Abi as TAbi, encodeFunctionData } from 'viem';

import { BaseConfig, BaseConfigParams, CallType } from '../base';

export interface ContractConfigParams extends Omit<BaseConfigParams, 'type'> {
  abi: TAbi;
  args: any[];
  address: string;
  /** ERC20 token to spend (allowance target), if not derivable from args */
  token?: string;
  value?: bigint;
}

export class ContractConfig extends BaseConfig {
  readonly abi: TAbi;

  readonly address: string;

  readonly args: any[];

  readonly token?: string;

  readonly value?: bigint;

  constructor({
    abi,
    address,
    args,
    token,
    value,
    ...other
  }: ContractConfigParams) {
    super({ ...other, type: CallType.Evm });
    this.abi = abi;
    this.address = address;
    this.args = args;
    this.token = token;
    this.value = value;
  }

  encodeFunctionData() {
    return encodeFunctionData({
      abi: this.abi,
      functionName: this.func,
      args: this.args,
    });
  }
}
