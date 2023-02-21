import { addressToEvm } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { EvmProvider } from '../types';

export class DefaultEvmProvider implements EvmProvider {
  readonly endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async toEvmAddress(address: string): Promise<string> {
    return u8aToHex(addressToEvm(address, true));
  }

  getEndpoint(): string {
    return this.endpoint;
  }
}
