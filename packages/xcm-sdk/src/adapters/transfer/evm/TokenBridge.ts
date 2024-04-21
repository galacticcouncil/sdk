import { Abi } from '@galacticcouncil/xcm-core';
import { EvmTransfer } from './EvmTransfer';

export class TokenBridge extends EvmTransfer {
  get abi() {
    return Abi.Bridge;
  }

  get address(): string {
    const { address } = this.config;
    if (address) {
      return address;
    }
    throw new Error('Bridge contract address is missing');
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
