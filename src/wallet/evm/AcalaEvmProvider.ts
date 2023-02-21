import { ApiPromise, ApiRx } from '@polkadot/api';
import { EvmProvider } from '../types';

export class AcalaEvmProvider implements EvmProvider {
  readonly api: ApiPromise | ApiRx;
  readonly endpoint: string;

  constructor(api: ApiPromise | ApiRx, endpoint: string) {
    this.api = api;
    this.endpoint = endpoint;
  }

  async toEvmAddress(address: string): Promise<string> {
    const h160Addr = await this.api.query.evmAccounts.evmAddresses(address);
    return h160Addr.toString();
  }

  getEndpoint(): string {
    return this.endpoint;
  }
}
