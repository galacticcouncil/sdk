import { BaseConfig, BaseConfigParams } from './BaseConfig';

import { CallType } from './types';

export interface SolanaQueryConfigParams
  extends Omit<BaseConfigParams, 'type'> {
  address: string;
  token?: string;
}

export class SolanaQueryConfig extends BaseConfig {
  readonly address: string;

  readonly token?: string;

  readonly type = CallType.Solana;

  constructor({ address, token, ...other }: SolanaQueryConfigParams) {
    super({ ...other, type: CallType.Solana });
    this.address = address;
    this.token = token;
  }
}
