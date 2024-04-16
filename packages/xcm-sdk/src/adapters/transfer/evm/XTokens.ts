import { Abi, Precompile } from '@galacticcouncil/xcm-core';
import { EvmTransfer } from './EvmTransfer';

export class XTokens extends EvmTransfer {
  get abi() {
    return Abi.XTokens;
  }

  get address(): string {
    const { address } = this.config;
    if (address) {
      return address;
    }
    return Precompile.XTokens;
  }

  get asset(): string {
    const { args } = this.config;
    const [asset] = args;
    return asset;
  }

  get amount(): string {
    const { args } = this.config;
    const [_asset, amount] = args;
    return amount;
  }
}
