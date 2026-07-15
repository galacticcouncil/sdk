import type { Forklift } from '@polkadot-api/forklift';
import type { HexString, PolkadotClient } from 'polkadot-api';
import type { Parachain } from '@galacticcouncil/xc-core';

import type { DecodedStorage } from './encode-storage';

export interface NewBlockParams {
  /** SCALE-encoded signed extrinsics to include in the block. */
  transactions?: HexString[];
  parent?: HexString;
  unsafeBlockHeight?: number;
}

export interface DevMethods {
  /** Builds a block and waits for the client to see it at the head. */
  newBlock: (params?: NewBlockParams) => Promise<HexString>;
  setStorage: (values: DecodedStorage, blockHash?: string) => Promise<unknown>;
}

export interface SetupCtx {
  url: string;
  fork: Forklift;
  client: PolkadotClient;
  dev: DevMethods;
  teardown: () => Promise<void>;
  pause: () => Promise<void>;
  config: Parachain;
}
