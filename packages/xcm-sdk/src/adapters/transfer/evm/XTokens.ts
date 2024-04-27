import { Abi } from '@galacticcouncil/xcm-core';
import { EvmTransfer } from './EvmTransfer';

export class Xtokens extends EvmTransfer {
  get abi() {
    return Abi.Xtokens;
  }

  get asset(): string {
    const { args } = this.config;
    const [asset] = args;
    return asset;
  }
}
