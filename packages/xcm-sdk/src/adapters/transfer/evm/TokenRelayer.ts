import { Abi } from '@galacticcouncil/xcm-core';
import { EvmTransfer } from './EvmTransfer';

export class TokenRelayer extends EvmTransfer {
  get abi() {
    return Abi.TokenRelayer;
  }

  get asset(): string {
    const { args } = this.config;
    const [asset] = args;
    return asset;
  }
}
