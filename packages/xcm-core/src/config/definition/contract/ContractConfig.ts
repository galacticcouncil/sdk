import { BaseConfig, BaseConfigParams, CallType } from '../base';

export interface ContractConfigParams extends Omit<BaseConfigParams, 'type'> {
  args: any[];
  address?: string;
}

export class ContractConfig extends BaseConfig {
  readonly args: any[];

  readonly address?: string;

  constructor({ args, address, ...other }: ContractConfigParams) {
    super({ ...other, type: CallType.Evm });
    this.args = args;
    this.address = address;
  }
}
