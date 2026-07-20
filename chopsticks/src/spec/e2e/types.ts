import type { PolkadotClient } from 'polkadot-api';
import type { Parachain } from '@galacticcouncil/xc-core';

export interface DevMethods {
  newBlock: (param?: Partial<any>) => Promise<string>;
  setStorage: (values: any, blockHash?: string) => Promise<any>;
  timeTravel: (date: string | number) => Promise<number>;
  setHead: (hashOrNumber: string | number) => Promise<any>;
}

export interface SetupCtx {
  url: string;
  chain: any;
  client: PolkadotClient;
  dev: DevMethods;
  teardown: () => Promise<void>;
  pause: () => Promise<void>;
  config: Parachain;
}
