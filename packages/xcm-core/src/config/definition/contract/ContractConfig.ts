import { type Abi as TAbi, encodeFunctionData } from 'viem';

import { BaseConfig, BaseConfigParams, CallType } from '../base';

export interface ContractConfigParams extends Omit<BaseConfigParams, 'type'> {
  abi: TAbi;
  args: any[];
  address: string;
  value?: bigint;
}

export class ContractConfig extends BaseConfig {
  readonly abi: TAbi;

  readonly address: string;

  readonly args: any[];

  readonly value?: bigint;

  constructor({ abi, address, args, value, ...other }: ContractConfigParams) {
    super({ ...other, type: CallType.Evm });
    this.abi = abi;
    this.address = address;
    this.args = args;
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
