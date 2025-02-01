import { SubmittableExtrinsicFunction } from '@polkadot/api/types';

import { BaseConfig, BaseConfigParams, CallType } from '../base';

export interface ExtrinsicConfigParams extends Omit<BaseConfigParams, 'type'> {
  txOptions?: {
    asset?: any;
  };
  getArgs: (func?: SubmittableExtrinsicFunction<'promise'>) => any[];
}

export class ExtrinsicConfig extends BaseConfig {
  getArgs: (func?: SubmittableExtrinsicFunction<'promise'>) => any[];

  readonly txOptions?: any;

  constructor({ getArgs, txOptions, ...other }: ExtrinsicConfigParams) {
    super({ ...other, type: CallType.Substrate });
    this.getArgs = getArgs;
    this.txOptions = txOptions;
  }
}
