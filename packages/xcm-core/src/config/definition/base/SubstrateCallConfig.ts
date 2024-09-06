import { CallType } from './types';
import { Parachain } from '../../../chain';

export interface SubstrateCallConfigParams {
  chain: Parachain;
  call: () => Promise<any>;
}

export class SubstrateCallConfig {
  readonly chain: Parachain;

  readonly call: () => Promise<any>;

  readonly type = CallType.Substrate;

  constructor({ chain, call }: SubstrateCallConfigParams) {
    this.chain = chain;
    this.call = call;
  }
}
