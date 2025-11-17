import { BaseConfig, BaseConfigParams, CallType } from '../base';

export type TxData = Record<string, any> | undefined;

export interface ExtrinsicConfigParams extends Omit<BaseConfigParams, 'type'> {
  getArgs: (func?: any) => TxData;
}

export class ExtrinsicConfig extends BaseConfig {
  getArgs: (func?: any) => TxData;

  constructor({ getArgs, ...other }: ExtrinsicConfigParams) {
    super({ ...other, type: CallType.Substrate });
    this.getArgs = getArgs;
  }
}
