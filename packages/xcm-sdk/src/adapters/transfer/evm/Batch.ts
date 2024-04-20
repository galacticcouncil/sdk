import { Abi, Precompile } from '@galacticcouncil/xcm-core';
import { EvmTransfer } from './EvmTransfer';

export class Batch extends EvmTransfer {
  get abi() {
    return Abi.Batch;
  }

  get address(): string {
    const { address } = this.config;
    if (address) {
      return address;
    }
    return Precompile.Batch;
  }

  get asset(): string {
    const { args } = this.config;
    const [to] = args;
    const [asset] = to;
    return asset;
  }

  get amount(): bigint {
    const { args } = this.config;
    const [_asset, amount] = args;
    return amount;
  }
}
