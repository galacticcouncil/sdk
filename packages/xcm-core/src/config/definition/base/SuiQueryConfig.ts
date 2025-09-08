import { BaseConfig, BaseConfigParams } from './BaseConfig';

import { CallType } from './types';

export interface SuiQueryConfigParams extends Omit<BaseConfigParams, 'type'> {
  address: string;
}

export class SuiQueryConfig extends BaseConfig {
  readonly address: string;

  readonly token?: string;

  constructor({ address, ...other }: SuiQueryConfigParams) {
    super({ ...other, type: CallType.Sui });
    this.address = address;
  }
}
