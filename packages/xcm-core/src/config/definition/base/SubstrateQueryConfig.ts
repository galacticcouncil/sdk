import { CallType } from './types';

import { BaseConfig, BaseConfigParams } from './BaseConfig';

export interface SubstrateQueryConfigParams
  extends Omit<BaseConfigParams, 'type'> {
  args?: any[];
  transform: (data: any) => Promise<bigint>;
}

export class SubstrateQueryConfig extends BaseConfig {
  readonly args: any[];

  readonly transform: (data: any) => Promise<bigint>;

  constructor({ args = [], transform, ...other }: SubstrateQueryConfigParams) {
    super({ ...other, type: CallType.Substrate });
    this.args = args;
    this.transform = transform;
  }
}
