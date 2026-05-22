import type { PolkadotClient } from 'polkadot-api';

import { decodeCompactLength } from './scale';
import {
  ClientSelector,
  FetchBlockOptions,
  RawBlock,
  SYSTEM_EVENTS_KEY,
} from './types';

interface SignedBlockRpc {
  block: {
    header: unknown;
    extrinsics: string[];
  };
  justifications?: unknown;
}

export class BlockFetcher {
  constructor(private readonly select: ClientSelector) {}

  static withClient(client: PolkadotClient): BlockFetcher {
    return new BlockFetcher(() => client);
  }

  async getHash(number: number): Promise<string | null> {
    const client = this.select();
    const hash = await client._request<string>('chain_getBlockHash', [number]);
    return hash && hash.length === 66 ? hash : null;
  }

  async getBlock(
    number: number,
    opts: FetchBlockOptions = {}
  ): Promise<RawBlock | null> {
    const hash = await this.getHash(number);
    if (!hash) return null;
    return this.getBlockAt(number, hash, opts);
  }

  async getBlockAt(
    number: number,
    hash: string,
    opts: FetchBlockOptions = {}
  ): Promise<RawBlock> {
    const client = this.select();

    const [signed, eventsHex] = await Promise.all([
      opts.withBlock
        ? client._request<SignedBlockRpc>('chain_getBlock', [hash])
        : Promise.resolve(null),
      opts.withEvents
        ? client._request<string | null>('state_getStorage', [
            SYSTEM_EVENTS_KEY,
            hash,
          ])
        : Promise.resolve(null),
    ]);

    const extrinsics = signed?.block?.extrinsics ?? [];
    const header = signed?.block?.header;

    const blockBytes = signed ? JSON.stringify(signed).length : 0;
    const eventsBytes = eventsHex ? eventsHex.length / 2 : 0;

    return {
      number,
      hash,
      header,
      extrinsics,
      eventsHex: eventsHex ?? undefined,
      eventsCount: eventsHex ? decodeCompactLength(eventsHex) : 0,
      bytes: blockBytes + eventsBytes,
    };
  }
}
