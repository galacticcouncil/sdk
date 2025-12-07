import { BaseConfig, BaseConfigParams, CallType } from '../base';

export type TxData = Record<string, any> | ExtrinsicConfig[];

export interface ExtrinsicConfigParams extends Omit<BaseConfigParams, 'type'> {
  getArgs: (func?: any) => Promise<TxData>;
}

export class ExtrinsicConfig extends BaseConfig {
  getArgs: (func?: any) => Promise<TxData>;

  constructor({ getArgs, ...other }: ExtrinsicConfigParams) {
    super({ ...other, type: CallType.Substrate });
    this.getArgs = getArgs;
  }
}
