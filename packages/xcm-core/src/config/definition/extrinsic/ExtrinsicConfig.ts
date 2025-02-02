import { SubmittableExtrinsicFunction } from '@polkadot/api/types';

import { BaseConfig, BaseConfigParams, CallType } from '../base';

export interface ExtrinsicConfigParams extends Omit<BaseConfigParams, 'type'> {
  getArgs: (func?: SubmittableExtrinsicFunction<'promise'>) => any[];
}

export class ExtrinsicConfig extends BaseConfig {
  getArgs: (func?: SubmittableExtrinsicFunction<'promise'>) => any[];

  constructor({ getArgs, ...other }: ExtrinsicConfigParams) {
    super({ ...other, type: CallType.Substrate });
    this.getArgs = getArgs;
  }
}
