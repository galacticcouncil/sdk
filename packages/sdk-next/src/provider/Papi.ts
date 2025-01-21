import { PolkadotClient } from 'polkadot-api';
import { hydration } from '@polkadot-api/descriptors';

export abstract class Papi {
  readonly client: PolkadotClient;

  constructor(client: PolkadotClient) {
    this.client = client;
  }

  public get api() {
    return this.client.getTypedApi(hydration);
  }
}
