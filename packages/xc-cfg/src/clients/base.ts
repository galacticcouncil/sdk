import { ChainDefinition, TypedApi } from 'polkadot-api';

import { Parachain } from '@galacticcouncil/xc-core';
export abstract class BaseClient<C extends ChainDefinition> {
  readonly chain: Parachain;

  constructor(chain: Parachain) {
    this.chain = chain;
  }

  get client() {
    return this.chain.client;
  }

  abstract api(): TypedApi<C>;
}
