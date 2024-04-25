import { Abi, Precompile } from '@galacticcouncil/xcm-core';
import { EvmTransfer } from './EvmTransfer';

export class Xtokens extends EvmTransfer {
  get abi() {
    return Abi.Xtokens;
  }

  get address(): string {
    const { address } = this.config;
    if (address) {
      return address;
    }
    return Precompile.Xtokens;
  }

  get asset(): string {
    const { args } = this.config;
    const [asset] = args;
    return asset;
  }

  get amount(): bigint {
    const { args } = this.config;
    const [_asset, amount] = args;
    return amount;
  }
}
