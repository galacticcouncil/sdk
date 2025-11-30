import { CallType } from './types';

export interface BaseConfigParams {
  module: string;
  func: string;
  type: CallType;
}

export class BaseConfig {
  readonly module: string;

  readonly func: string;

  readonly type: CallType;

  constructor({ module, func, type }: BaseConfigParams) {
    this.module = module;
    this.func = func;
    this.type = type;
  }

  toString() {
    return this.module + ':' + this.func;
  }
}
