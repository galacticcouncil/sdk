import { PolkadotClient, TypedApi } from 'polkadot-api';

import { hydration } from '@galacticcouncil/descriptors';

import { ChainWatcher } from './ChainWatcher';

export abstract class Papi {
  readonly client: PolkadotClient;
  readonly api: TypedApi<typeof hydration>;
  readonly watcher: ChainWatcher;

  constructor(client: PolkadotClient) {
    this.client = client;
    this.api = this.client.getTypedApi(hydration);
    this.watcher = ChainWatcher.getInstance(this.client);
  }
}
