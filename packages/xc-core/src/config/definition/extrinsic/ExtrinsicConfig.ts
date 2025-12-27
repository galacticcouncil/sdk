import { PolkadotClient, Transaction, UnsafeTransaction } from 'polkadot-api';

import { BaseConfig, BaseConfigParams, CallType } from '../base';

type SafeTx = Transaction<any, string, string, void | undefined>;
type UnsafeTx = UnsafeTransaction<any, string, string, void | undefined>;

export type Extrinsic = SafeTx | UnsafeTx;

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
