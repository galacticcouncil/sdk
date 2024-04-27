import { Abi } from '@galacticcouncil/xcm-core';
import { EvmTransfer } from './EvmTransfer';

export class Batch extends EvmTransfer {
  get abi() {
    return Abi.Batch;
  }

  get asset(): string {
    const { args } = this.config;
    const [to] = args;
    const [asset] = to;
    return asset;
  }
}
