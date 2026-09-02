import { PolkadotClient, TypedApi } from 'polkadot-api';

import { firstValueFrom } from 'rxjs';

import {
  hydration,
  hydrationNext,
  hydrationIce,
} from '@galacticcouncil/descriptors';

import { Watcher } from './Watcher';

/** Block hash to read at; unset follows the best chain */
export type BlockAt = string;

/** A block, by both of the things a read may need */
export interface BlockRef {
  hash: string;
  number: number;
}

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

  /**
   * Resolve a read target to the block it names.
   *
   * - No fixed block takes the best chain's tip, off the followed stream
   * - A hash needs its height; every read below can then pin
   *
   * @param at - block hash, or `best` for the tip
   */
  protected async resolveBlock(at: BlockAt = this.at): Promise<BlockRef> {
    if (at === 'best') {
      const [tip] = await firstValueFrom(this.client.bestBlocks$);
      return { hash: tip.hash, number: tip.number };
    }

    if (at.startsWith('0x')) {
      const number = await this.api.query.System.Number.getValue({ at });
      return { hash: at, number: number };
    }

    throw new Error(`Block hash expected, got '${at}'`);
  }
}
