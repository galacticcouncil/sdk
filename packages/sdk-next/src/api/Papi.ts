import { PolkadotClient, TypedApi } from 'polkadot-api';

import { hydration } from '@galacticcouncil/descriptors';

import { Watcher } from './Watcher';

export abstract class Papi {
  readonly client: PolkadotClient;
  readonly api: TypedApi<typeof hydration>;
  readonly watcher: Watcher;

  constructor(client: PolkadotClient) {
    this.client = client;
    this.api = this.client.getTypedApi(hydration);
    this.watcher = Watcher.getInstance(this.client);
  }
}
