import { type Abi as TAbi, encodeFunctionData } from 'viem';

import { BaseConfig, BaseConfigParams, CallType } from '../base';

export interface ContractConfigParams extends Omit<BaseConfigParams, 'type'> {
  abi: TAbi;
  args: any[];
  address: string;
}

export class ContractConfig extends BaseConfig {
  readonly abi: TAbi;

  readonly address: string;

  readonly args: any[];

  constructor({ abi, address, args, ...other }: ContractConfigParams) {
    super({ ...other, type: CallType.Evm });
    this.abi = abi;
    this.address = address;
    this.args = args;
  }

  encodeFunctionData() {
    return encodeFunctionData({
      abi: this.abi,
      functionName: this.func,
      args: this.args,
    });
  }
}
