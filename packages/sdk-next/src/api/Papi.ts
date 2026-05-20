import { PolkadotClient, TypedApi } from 'polkadot-api';

import {
  hydration,
  hydrationNext,
  hydrationIce,
} from '@galacticcouncil/descriptors';

import { Watcher } from './Watcher';

export type BlockAt = 'best' | 'finalized' | (string & {});

export abstract class Papi {
  readonly client: PolkadotClient;
  readonly api: TypedApi<typeof hydration>;
  readonly apiNext: TypedApi<typeof hydrationNext>;
  readonly apiIce: TypedApi<typeof hydrationIce>;

  readonly watcher: Watcher;
  readonly at: BlockAt;

  constructor(client: PolkadotClient, at?: BlockAt) {
    this.client = client;
    this.api = this.client.getTypedApi(hydration);
    this.apiNext = this.client.getTypedApi(hydrationNext);
    this.apiIce = this.client.getTypedApi(hydrationIce);
    this.watcher = Watcher.getInstance(this.client);
    this.at = at ?? 'best';
  }
}
