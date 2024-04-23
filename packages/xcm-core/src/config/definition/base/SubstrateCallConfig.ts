import { ApiPromise } from '@polkadot/api';

import { CallType } from './types';

export interface SubstrateCallConfigParams {
  api: ApiPromise;
  call: () => Promise<bigint>;
}

export class SubstrateCallConfig {
  readonly api: ApiPromise;

  readonly call: () => Promise<any>;

  readonly type = CallType.Substrate;

  constructor({ api, call }: SubstrateCallConfigParams) {
    this.api = api;
    this.call = call;
  }
}
