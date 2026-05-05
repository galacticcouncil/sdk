import { PolkadotClient, Transaction } from 'polkadot-api';

import { BaseConfig, BaseConfigParams, CallType } from '../base';

export type Extrinsic = Transaction<void | undefined>;

export interface ExtrinsicConfigParams extends Omit<BaseConfigParams, 'type'> {
  getTx: (client: PolkadotClient) => Extrinsic;
}

export class ExtrinsicConfig extends BaseConfig {
  getTx: (client: PolkadotClient) => Extrinsic;

  constructor({ getTx, ...other }: ExtrinsicConfigParams) {
    super({ ...other, type: CallType.Substrate });
    this.getTx = getTx;
  }
}
