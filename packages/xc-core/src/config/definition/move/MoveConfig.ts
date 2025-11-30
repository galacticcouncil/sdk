import { Transaction } from '@mysten/sui/transactions';

import { BaseConfig, BaseConfigParams, CallType } from '../base';

export interface MoveConfigParams extends Omit<BaseConfigParams, 'type'> {
  transaction: Transaction;
}

export class MoveConfig extends BaseConfig {
  readonly transaction: Transaction;

  constructor({ transaction, ...other }: MoveConfigParams) {
    super({ ...other, type: CallType.Sui });
    this.transaction = transaction;
  }
}
