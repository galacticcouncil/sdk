import { ApiPromise } from '@polkadot/api';
import '@polkadot/api-augment';

export abstract class PolkadotApiClient {
  protected readonly api: ApiPromise;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  public get chainDecimals() {
    return this.api.registry.chainDecimals[0];
  }

  public get chainToken() {
    return this.api.registry.chainTokens[0];
  }
}
